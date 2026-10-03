// app/api/admin/branding/logo/route.ts
//
// Admin-only upload and removal of the Dine3D logo.
//
// Authorization is enforced on EVERY method with `requireAdminApi` before any
// storage call, so an unauthenticated or logged-out caller cannot upload a file,
// delete the live logo, or even discover that the bucket exists.
//
// The browser never receives the service-role key: it posts the file here, and
// this handler is what talks to Supabase Storage.

import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import {
  BRANDING_BUCKET,
  FALLBACK_LOGO_URL,
  LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  deleteManagedLogo,
  formatBytes,
  getLogoReference,
  isManagedLogoUrl,
  isMissingBrandingBucketError,
  setLogoUrl,
  sniffImageMime,
  uploadLogo,
} from '@/lib/branding.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: NO_STORE });
}

/** Hints used when the browser's own `type` disagrees with the real bytes. */
const ACCEPTED_LABEL = 'PNG, JPG or WebP';

/**
 * POST /api/admin/branding/logo
 *
 * Multipart body with a single `file` field.
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let file: File | null = null;
  // The browser measures the file before sending it. These are only used to
  // reserve the right box for the new asset; they never influence what is
  // stored, and the reference always falls back to the shipped dimensions when
  // they are missing or nonsensical.
  let dimensions: { width?: number; height?: number } = {};

  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return fail(`Send the logo as multipart/form-data with a "file" field.`, 415);
    }

    const form = await request.formData();
    const candidate = form.get('file');

    if (!candidate || typeof candidate === 'string') {
      return fail('No file was received. Choose a logo image and try again.', 400);
    }

    file = candidate;

    const width = Number(form.get('width'));
    const height = Number(form.get('height'));
    if (Number.isFinite(width) && width > 0) dimensions.width = Math.round(width);
    if (Number.isFinite(height) && height > 0) dimensions.height = Math.round(height);
  } catch {
    return fail('Could not read the upload. Try again with a smaller file.', 400);
  }

  if (file.size === 0) {
    return fail('That file is empty.', 400);
  }

  if (file.size > MAX_LOGO_BYTES) {
    return fail(
      `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_LOGO_BYTES)}.`,
      413
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return fail('Could not read the uploaded file.', 400);
  }

  if (buffer.length > MAX_LOGO_BYTES) {
    return fail(
      `That image is ${formatBytes(buffer.length)}. The maximum is ${formatBytes(MAX_LOGO_BYTES)}.`,
      413
    );
  }

  // The real file type is decided by the magic bytes, never by the filename or
  // the Content-Type the browser claimed.
  const mimeType = sniffImageMime(buffer);

  if (!mimeType) {
    return fail(`That file is not an image. Upload an ${ACCEPTED_LABEL} file.`, 415);
  }

  // Reject a declared type that contradicts the actual bytes, e.g. a PNG sent
  // as "image/jpeg". Only checked when the browser sent a specific type at all.
  const declared = (file.type || '').toLowerCase();
  if (
    declared &&
    declared !== 'application/octet-stream' &&
    !LOGO_MIME_TYPES.includes(declared as (typeof LOGO_MIME_TYPES)[number])
  ) {
    return fail(`That file type (${declared}) is not supported. Upload an ${ACCEPTED_LABEL} file.`, 415);
  }

  const previous = await getLogoReference();

  let stored;
  try {
    stored = await uploadLogo(buffer, mimeType);
  } catch (error) {
    // The bucket is missing infrastructure, not a bad request: answer 503 so the
    // owner is told to apply the migration rather than to try a different file.
    if (isMissingBrandingBucketError(error)) {
      return fail((error as Error).message, 503);
    }

    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  try {
    const logo = await setLogoUrl(stored.publicUrl, dimensions);

    // Only clean up the previous asset once the new one is live and referenced,
    // so a failure at any earlier point leaves the site on a working logo.
    const removedPrevious = isManagedLogoUrl(previous.logoUrl)
      ? await deleteManagedLogo(previous.logoUrl)
      : false;

    return NextResponse.json(
      {
        success: true,
        logo,
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
    await deleteManagedLogo(stored.publicUrl);

    const message = error instanceof Error ? error.message : 'Could not save the new logo.';
    return fail(
      /does not exist|violates row-level security/i.test(message)
        ? `${message} The "${BRANDING_BUCKET}" bucket and the site_content table must both exist.`
        : message,
      500
    );
  }
}

/**
 * DELETE /api/admin/branding/logo
 *
 * Removes the uploaded asset and points the site back at the bundled logo.
 */
export async function DELETE() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const current = await getLogoReference();

  if (!isManagedLogoUrl(current.logoUrl)) {
    // Already on the shipped asset. Still normalise the reference so the state
    // the UI shows matches the database.
    const logo = await setLogoUrl(FALLBACK_LOGO_URL);
    return NextResponse.json(
      { success: true, logo, removedFile: false, message: 'No uploaded logo to remove.' },
      { headers: NO_STORE }
    );
  }

  let logo;
  try {
    // Clear the reference first. If deleting the file then fails, the worst case
    // is an orphaned object — the site never points at something that is gone.
    logo = await setLogoUrl(FALLBACK_LOGO_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove the logo.';
    return fail(message, 500);
  }

  const removedFile = await deleteManagedLogo(current.logoUrl);

  return NextResponse.json(
    {
      success: true,
      logo,
      removedFile,
      message: removedFile
        ? 'Logo removed. The site is using the bundled Dine3D logo again.'
        : 'Logo removed from the site. The stored file could not be deleted.',
    },
    { headers: NO_STORE }
  );
}