// lib/heroImage.ts
//
// The Dine3D hero background image: shared, dependency-free constants and types.
//
// Deliberately free of Supabase, `next/headers` and `server-only` so it can be
// imported from route handlers, server components AND client components. The
// storage code lives separately in `lib/heroImage.server.ts`, which must never be
// pulled into a browser bundle.
//
// SCOPE
// -----
// This is the optional background image shown behind the HERO section (the first
// screen: headline, CTA buttons, and the floating 3D food model). It is distinct
// from the site logo (see lib/branding.ts) and from 3D dish models
// (see lib/foodModel.ts).

/* ============================================================
   CONSTANTS
   ============================================================ */

/**
 * 5 MiB.
 *
 * Mirrored by `file_size_limit` on the `dine3d-branding` bucket (migration 009),
 * so an oversized upload is rejected by Storage as well as by this app.
 *
 * 5 MiB is generous for a hero photograph — a full-width web photo at 2× density
 * sits around 1.5–3 MiB — while still bounding abuse. It is larger than the logo
 * ceiling (2 MiB) because a hero image is a real photograph, not a compact mark.
 */
export const MAX_HERO_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Broad image support for a hero background, well beyond the logo's PNG/JPG/WebP
 * triangle. Every entry is validated server-side by magic bytes, never by the
 * browser's claimed type.
 */
export const HERO_IMAGE_MIME_TYPES = [
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

export type HeroImageMimeType = (typeof HERO_IMAGE_MIME_TYPES)[number];

/** Short label reused by every validation message and hint. */
export const ACCEPTED_HERO_IMAGE_LABEL = 'PNG, JPG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC, APNG, ICO';

/** What the file picker offers. Order is the order shown to the owner. */
export const HERO_IMAGE_FILE_ACCEPT =
  '.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.svg,.avif,.heic,.heif,.apng,.ico,.cur,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/avif,image/heic,image/heif,image/apng,image/x-icon,image/vnd.microsoft.icon';

/* ============================================================
   HELPERS
   ============================================================ */

export { formatBytes } from './branding';
import { formatBytes } from './branding';

/**
 * Client-side pre-check, so an obviously wrong file is rejected instantly without
 * an upload round trip.
 *
 * The upload route re-validates the real bytes (magic-byte sniffing); this only
 * exists to give immediate feedback on size and declared type. It deliberately
 * does NOT sniff magic bytes on the client: that logic is server-only to avoid
 * duplicating the detection surface and because a 12-byte probe costs nothing
 * compared to the upload itself.
 */
export function isAcceptableHeroImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty.' };
  }

  if (file.size > MAX_HERO_IMAGE_BYTES) {
    return {
      ok: false,
      error: `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_HERO_IMAGE_BYTES)}.`,
    };
  }

  const type = (file.type || '').toLowerCase();
  if (type && !HERO_IMAGE_MIME_TYPES.includes(type as HeroImageMimeType)) {
    return { ok: false, error: `That file type is not supported. Choose an ${ACCEPTED_HERO_IMAGE_LABEL} file.` };
  }

  return { ok: true };
}
