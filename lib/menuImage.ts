// lib/menuImage.ts
//
// Menu-item dish photograph: shared, dependency-free constants and types.
//
// Deliberately free of Supabase, `next/headers` and `server-only` so it can be
// imported from route handlers, server components AND client components. The
// storage code lives separately in `lib/menuImage.server.ts`, which must never be
// pulled into a browser bundle.
//
// STORAGE
// -------
// The file lives in the existing public `dine3d-branding` bucket (created by
// migration 005, broadened to every image format by migration 009) under the
// `dish-photos/` prefix. That bucket already carries a public SELECT policy and
// deliberately NO write policy, so a browser cannot upload to it even with a
// valid session. Writes only happen through the server route holding the
// service-role key.
//
// The prefix distinguishes dish photos from the site logo (`site-logo-…`) and
// the hero background (`hero-bg-…`) that share the same bucket.

/* ============================================================
   CONSTANTS
   ============================================================ */

/** 5 MiB. Mirrors the bucket ceiling in migration 009. */
export const MAX_MENU_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Broad image support for a dish photograph. Every entry is validated
 * server-side by magic bytes, never by the browser's claimed type.
 */
export const MENU_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/apng',
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const;

export type MenuImageMimeType = (typeof MENU_IMAGE_MIME_TYPES)[number];

/** Short label reused by every validation message and hint. */
export const ACCEPTED_MENU_IMAGE_LABEL = 'PNG, JPG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC, APNG, ICO';

/** What the file picker offers. Order is the order shown to the owner. */
export const MENU_IMAGE_FILE_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.svg,.avif,.heic,.heif,.apng,.ico,.cur,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/avif,image/heic,image/heif,image/apng,image/x-icon,image/vnd.microsoft.icon';

/* ============================================================
   HELPERS
   ============================================================ */

export { formatBytes } from './branding';
import { formatBytes } from './branding';

/**
 * Client-side pre-check, so an obviously wrong file is rejected instantly
 * without an upload round trip.
 *
 * The upload route re-validates the real bytes (magic-byte sniffing); this only
 * exists to give immediate feedback on size and declared type. It deliberately
 * does NOT sniff magic bytes on the client: that logic is server-only to avoid
 * duplicating the detection surface.
 */
export function isAcceptableMenuImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty.' };
  }

  if (file.size > MAX_MENU_IMAGE_BYTES) {
    return {
      ok: false,
      error: `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_MENU_IMAGE_BYTES)}.`,
    };
  }

  const type = (file.type || '').toLowerCase();
  if (type && !MENU_IMAGE_MIME_TYPES.includes(type as MenuImageMimeType)) {
    return { ok: false, error: `That file type is not supported. Choose an ${ACCEPTED_MENU_IMAGE_LABEL} file.` };
  }

  return { ok: true };
}

/** True when the URL points at a dish photo this app manages in the branding bucket. */
export function isManagedMenuImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return false;

  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/dine3d-branding/dish-photos/';
    return parsed.pathname.startsWith(marker);
  } catch {
    return false;
  }
}