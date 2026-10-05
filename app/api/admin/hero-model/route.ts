// app/api/admin/hero-model/route.ts
//
// Admin-only upload and removal of the 3D food model shown in the landing page
// hero.
//
// Authorization is enforced on EVERY method with `requireAdminApi` before any
// storage call, so an unauthenticated or logged-out caller cannot upload a file,
// delete the live model, or even discover that the bucket exists.
//
// The browser never receives the service-role key: it posts the file here, and
// this handler is what talks to Supabase Storage.
//
// WHAT IS ACCEPTED
// Only `.glb` (glTF 2.0 binary). A `.gltf` is a JSON manifest that needs sibling
// `.bin` and image files, which a single-file upload cannot carry — see the long
// note in lib/foodModel.ts. A `.gltf` upload is refused here with a message that
// says how to fix it, rather than being stored and then failing to load in every
// visitor's browser.

import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import {
  ACCEPTED_MODEL_LABEL,
  FOOD_MODEL_BUCKET,
  MODEL_MIME_TYPES,
  MAX_MODEL_BYTES,
  deleteManagedModel,
  formatBytes,
  getFoodModelReference,
  isManagedModelUrl,
  isMissingFoodModelBucketError,
  setHeroModelUrl,
  sniffModelMime,
  uploadFoodModel,
  validateGlbBuffer,
} from '@/lib/foodModel.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: NO_STORE });
}

/**
 * Maps a validation failure onto the right HTTP status.
 *
 * The status is chosen so the right thing happens even if a client ignores the
 * message: an oversized file is 413, an unreadable container is 415, and a
 * damaged or truncated one is 400.
 */
function statusForReason(reason: string): number {
  if (reason === 'too-large') return 413;
  if (reason === 'length-mismatch' || reason === 'empty') return 400;
  return 415;
}

/**
 * POST /api/admin/hero-model
 *
 * Multipart body with a single `file` field, plus an optional `name` used only
 * as the admin-panel display label.
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let file: File | null = null;
  // Shown in the admin panel so the owner can tell which dish is live without
  // reading a storage URL. Never rendered on the public site.
  let displayName = '';

  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return fail(
        `Send the model as multipart/form-data with a "file" field.`,
        415
      );
    }

    const form = await request.formData();
    const candidate = form.get('file');

    if (!candidate || typeof candidate === 'string') {
      return fail(
        `No file was received. Choose an ${ACCEPTED_MODEL_LABEL} file and try again.`,
        400
      );
    }

    file = candidate;

    const name = form.get('name');
    if (typeof name === 'string') displayName = name.trim().slice(0, 120);
  } catch {
    return fail('Could not read the upload. Try again with a smaller file.', 400);
  }

  if (file.size === 0) {
    return fail('That file is empty.', 400);
  }

  if (file.size > MAX_MODEL_BYTES) {
    return fail(
      `That model is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_MODEL_BYTES)}.`,
      413
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return fail('Could not read the uploaded file.', 400);
  }

  // Re-check against the bytes we actually received, not the declared size: the
  // two can differ, and only the buffer is what will be stored.
  if (buffer.length > MAX_MODEL_BYTES) {
    return fail(
      `That model is ${formatBytes(buffer.length)}. The maximum is ${formatBytes(MAX_MODEL_BYTES)}.`,
      413
    );
  }

  // The real file type is decided by the magic bytes, never by the filename or
  // the Content-Type the browser claimed. This also verifies the glTF version
  // and that the declared length matches, which is what catches a truncated or
  // corrupted export before it becomes a broken hero for every visitor.
  const validated = validateGlbBuffer(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );

  if (!validated.ok) {
    return fail(validated.error, statusForReason(validated.reason));
  }

  // Sniffed separately from the validation above so the stored MIME type comes
  // from the same source of truth, and so the "not a model at all" case is
  // distinguishable from "a model we cannot accept".
  const mimeType = sniffModelMime(buffer);
  if (!mimeType) {
    return fail(
      `That file is not an ${ACCEPTED_MODEL_LABEL} model.`,
      415
    );
  }

  // Reject a declared type that contradicts the actual bytes. Only checked when
  // the browser sent a specific type at all — it very often sends
  // `application/octet-stream` for .glb, which is not a contradiction.
  const declared = (file.type || '').toLowerCase();
  if (
    declared &&
    declared !== 'application/octet-stream' &&
    !MODEL_MIME_TYPES.includes(declared as (typeof MODEL_MIME_TYPES)[number])
  ) {
    return fail(
      `That file type (${declared}) is not supported. Upload an ${ACCEPTED_MODEL_LABEL} file.`,
      415
    );
  }

  const previous = await getFoodModelReference();

  let stored;
  try {
    stored = await uploadFoodModel(buffer, mimeType);
  } catch (error) {
    // The bucket is missing infrastructure, not a bad request: answer 503 so the
    // owner is told to apply the migration rather than to try a different file.
    if (isMissingFoodModelBucketError(error)) {
      return fail((error as Error).message, 503);
    }

    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  // Fall back to the uploaded filename (minus the extension) when the client did
  // not supply a label, so the admin panel is never showing a blank name for a
  // model that is demonstrably live.
  const finalName =
    displayName ||
    previous.modelName ||
    (file.name || '').replace(/\.glb$/i, '').slice(0, 120) ||
    '';

  try {
    const model = await setHeroModelUrl(stored.publicUrl, finalName);

    // Only clean up the previous asset once the new one is live and referenced,
    // so a failure at any earlier point leaves the site on a working model.
    const removedPrevious = isManagedModelUrl(previous.modelUrlGlb)
      ? await deleteManagedModel(previous.modelUrlGlb)
      : false;

    return NextResponse.json(
      {
        success: true,
        model,
        file: {
          bytes: stored.bytes,
          mimeType: stored.mimeType,
          version: stored.version,
        },
        removedPrevious,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    // The file uploaded but the reference did not update. Remove the orphan so
    // a failed attempt does not quietly consume storage forever.
    await deleteManagedModel(stored.publicUrl);

    const message = error instanceof Error ? error.message : 'Could not save the new model.';
    return fail(
      /does not exist|violates row-level security/i.test(message)
        ? `${message} The "${FOOD_MODEL_BUCKET}" bucket and the site_content table must both exist.`
        : message,
      500
    );
  }
}

/**
 * DELETE /api/admin/hero-model
 *
 * Removes the uploaded model and points the hero back at the bundled
 * demonstration dish.
 */
export async function DELETE() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const current = await getFoodModelReference();

  if (!isManagedModelUrl(current.modelUrlGlb)) {
    // Already on the bundled dish. Still normalise the reference so the state
    // the UI shows matches the database.
    const model = await setHeroModelUrl(null);
    return NextResponse.json(
      { success: true, model, removedFile: false, message: 'No uploaded model to remove.' },
      { headers: NO_STORE }
    );
  }

  let model;
  try {
    // Clear the reference first. If deleting the file then fails, the worst case
    // is an orphaned object — the site never points at something that is gone.
    model = await setHeroModelUrl(null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove the model.';
    return fail(message, 500);
  }

  const removedFile = await deleteManagedModel(current.modelUrlGlb);

  return NextResponse.json(
    {
      success: true,
      model,
      removedFile,
      message: removedFile
        ? 'Model removed. The hero is using the built-in demonstration dish again.'
        : 'Model removed from the site. The stored file could not be deleted.',
    },
    { headers: NO_STORE }
  );
}
