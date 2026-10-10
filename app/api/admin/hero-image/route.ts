// app/api/admin/hero-image/route.ts
//
// Admin-only upload and removal of the HERO background image.
//
// Authorization is enforced on EVERY method with `requireAdminApi` before any
// storage call, so an unauthenticated or logged-out caller cannot upload a file,
// delete the live image, or even discover that the bucket exists.
//
// The browser never receives the service-role key: it posts the file here, and
// this handler is what talks to Supabase Storage.
//
// WHAT IS ACCEPTED
// Any common image format: PNG, JPG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC/HEIF,
// APNG, ICO. The real type is decided by magic bytes server-side, never by the
// browser's claimed type or the file extension.

import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import {
  ACCEPTED_HERO_IMAGE_LABEL,
  MAX_HERO_IMAGE_BYTES,
  deleteManagedHeroImage,
  formatBytes,
  getHeroImageReference,
  isManagedHeroImageUrl,
  isMissingHeroImageBucketError,
  setHeroImageUrl,
  sniffImageMime,
  uploadHeroImage,
} from '@/lib/heroImage.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: NO_STORE });
}

/**
 * POST /api/admin/hero-image
 *
 * Multipart body with a single `file` field.
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let file: File | null = null;

  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return fail(`Send the image as multipart/form-data with a "file" field.`, 415);
    }

    const form = await request.formData();
    const candidate = form.get('file');

    if (!candidate || typeof candidate === 'string') {
      return fail('No file was received. Choose an image and try again.', 400);
    }

    file = candidate;
  } catch {
    return fail('Could not read the upload. Try again with a smaller file.', 400);
  }

  if (file.size === 0) {
    return fail('That file is empty.', 400);
  }

  if (file.size > MAX_HERO_IMAGE_BYTES) {
    return fail(
      `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_HERO_IMAGE_BYTES)}.`,
      413
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return fail('Could not read the uploaded file.', 400);
  }

  // Re-check against the bytes we actually received, not the declared size.
  if (buffer.length > MAX_HERO_IMAGE_BYTES) {
    return fail(
      `That image is ${formatBytes(buffer.length)}. The maximum is ${formatBytes(MAX_HERO_IMAGE_BYTES)}.`,
      413
    );
  }

  // The real file type is decided by the magic bytes, never by the filename or
  // the Content-Type the browser claimed.
  const mimeType = sniffImageMime(buffer);

  if (!mimeType) {
    return fail(`That file is not an image. Upload an ${ACCEPTED_HERO_IMAGE_LABEL} file.`, 415);
  }

  // Reject a declared type that contradicts the actual bytes, e.g. a PNG sent
  // as "image/jpeg". Only checked when the browser sent a specific type at all.
  const declared = (file.type || '').toLowerCase();
  if (
    declared &&
    declared !== 'application/octet-stream' &&
    !(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/avif', 'image/heic', 'image/heif', 'image/apng', 'image/x-icon', 'image/vnd.microsoft.icon'] as const).includes(
      declared as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/bmp' | 'image/tiff' | 'image/svg+xml' | 'image/avif' | 'image/heic' | 'image/heif' | 'image/apng' | 'image/x-icon' | 'image/vnd.microsoft.icon'
    )
  ) {
    return fail(`That file type (${declared}) is not supported. Upload an ${ACCEPTED_HERO_IMAGE_LABEL} file.`, 415);
  }

  const previous = await getHeroImageReference();

  let stored;
  try {
    stored = await uploadHeroImage(buffer, mimeType);
  } catch (error) {
    if (isMissingHeroImageBucketError(error)) {
      return fail((error as Error).message, 503);
    }

    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  try {
    const reference = await setHeroImageUrl(stored.publicUrl);

    // Only clean up the previous asset once the new one is live and referenced,
    // so a failure at any earlier point leaves the site on its current image.
    const removedPrevious = isManagedHeroImageUrl(previous.imageUrl)
      ? await deleteManagedHeroImage(previous.imageUrl)
      : false;

    return NextResponse.json(
      {
        success: true,
        imageUrl: reference.imageUrl,
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
    await deleteManagedHeroImage(stored.publicUrl);

    const message = error instanceof Error ? error.message : 'Could not save the new image.';
    return fail(
      /does not exist|violates row-level security/i.test(message)
        ? `${message} The "dine3d-branding" bucket and the site_content table must both exist.`
        : message,
      500
    );
  }
}

/**
 * DELETE /api/admin/hero-image
 *
 * Removes the uploaded hero background image and clears the `hero.imageUrl`
 * reference so the site falls back to its solid-color background.
 */
export async function DELETE() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const current = await getHeroImageReference();

  if (!current.isManaged) {
    // Either nothing was ever uploaded, or the owner pasted an external URL.
    // In both cases there is no file to delete; just normalise the reference.
    await setHeroImageUrl('');
    return NextResponse.json(
      { success: true, imageUrl: '', removedFile: false, message: 'No uploaded image to remove.' },
      { headers: NO_STORE }
    );
  }

  let reference;
  try {
    // Clear the reference first. If deleting the file then fails, the worst case
    // is an orphaned object — the site never points at something that is gone.
    reference = await setHeroImageUrl('');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not remove the image.';
    return fail(message, 500);
  }

  const removedFile = await deleteManagedHeroImage(current.imageUrl);

  return NextResponse.json(
    {
      success: true,
      imageUrl: reference.imageUrl,
      removedFile,
      message: removedFile
        ? 'Hero image removed. The site is using its default background again.'
        : 'Hero image removed from the site. The stored file could not be deleted.',
    },
    { headers: NO_STORE }
  );
}
