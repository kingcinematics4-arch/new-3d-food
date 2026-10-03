// lib/branding.ts
//
// The Dine3D brand logo: shared, dependency-free constants and types.
//
// Deliberately free of Supabase, `next/headers` and `server-only` so it can be
// imported from route handlers, server components AND client components. The
// storage code lives separately in `lib/branding.server.ts`, which must never be
// pulled into a browser bundle.

/* ============================================================
   CONSTANTS
   ============================================================ */

/** The asset that ships with the repo, used whenever no logo has been uploaded. */
export const FALLBACK_LOGO_URL = '/images/dine3d-logo.jpg';

/**
 * 2 MiB. Mirrored by `file_size_limit` on the `dine3d-branding` bucket, so an
 * oversized upload is rejected by Storage as well as by the upload route.
 */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type LogoMimeType = (typeof LOGO_MIME_TYPES)[number];

/** Short label reused by every validation message and hint. */
export const ACCEPTED_LOGO_LABEL = 'PNG, JPG or WebP';

/** What the file picker offers. Order is the order shown to the owner. */
export const LOGO_FILE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

/* ============================================================
   SHAPE
   ============================================================ */

export interface LogoReference {
  /** Absolute Supabase URL when uploaded, otherwise the bundled fallback path. */
  logoUrl: string;
  /**
   * Opaque token that changes every time the logo file changes. Appended to the
   * URL as `?v=` so browsers and CDNs refetch the new asset instead of serving
   * the previously cached one.
   */
  logoVersion: string | null;
  logoAlt: string;
  /**
   * Intrinsic pixel dimensions of the file. Handed to next/image so the browser
   * reserves the correct box before the image loads. Always the real size of the
   * current asset, so a logo of any shape renders without shifting or stretching.
   */
  logoWidth: number;
  logoHeight: number;
  /** False while the bundled fallback is still in use. */
  hasCustomLogo: boolean;
}

/** Real dimensions of `public/images/dine3d-logo.jpg`. */
export const FALLBACK_LOGO_SIZE = { width: 1376, height: 768 } as const;

export const FALLBACK_LOGO_REFERENCE: LogoReference = {
  logoUrl: FALLBACK_LOGO_URL,
  logoVersion: null,
  logoAlt: 'Dine3D',
  logoWidth: FALLBACK_LOGO_SIZE.width,
  logoHeight: FALLBACK_LOGO_SIZE.height,
  hasCustomLogo: false,
};

/* ============================================================
   HELPERS
   ============================================================ */

/**
 * Appends the cache-busting token to a logo URL.
 *
 * Only versioned URLs get a query string, so the bundled `/images/...` asset
 * keeps working unchanged whether or not a version is known.
 */
export function withCacheBust(url: string, version: string | null | undefined): string {
  if (!url || !version) return url;
  if (url.startsWith('data:')) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side pre-check. The route re-validates the real bytes; this only exists
 * so an obviously wrong file is rejected instantly without an upload round trip.
 */
export function isAcceptableLogoFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) {
    return { ok: false, error: 'That file is empty.' };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      error: `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_LOGO_BYTES)}.`,
    };
  }

  const type = (file.type || '').toLowerCase();
  if (type && !LOGO_MIME_TYPES.includes(type as LogoMimeType)) {
    return { ok: false, error: `That file type is not supported. Choose an ${ACCEPTED_LOGO_LABEL} file.` };
  }

  return { ok: true };
}