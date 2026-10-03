// lib/branding.server.ts
//
// SERVER ONLY. Everything that touches the Dine3D logo file.
//
// NEVER import this from a client component: it reaches for the Supabase
// service-role key, which bypasses RLS and must never enter a browser bundle.
//
// DATA MODEL
// ----------
// There is no separate branding/settings table. The logo reference lives inside
// the existing singleton `site_content` row (id = 'main'), in `branding.logoUrl`.
//
// The FILE itself lives in the public read-only storage bucket `dine3d-branding`
// (migration 005). That bucket has a public SELECT policy and deliberately no
// INSERT / UPDATE / DELETE policy, so a browser cannot write to it even with a
// valid session. Writes only happen here, server-side.
//
// Replacing the logo rewrites `branding.logoUrl` in BOTH the draft and the
// published document inside the same row, so the new logo is live immediately
// without the owner having to remember a separate publish step. `published` is
// only touched when it already has content, so this can never accidentally
// publish unrelated unpublished copy.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  DEFAULT_SITE_CONTENT,
  normalizeSiteContent,
  type Branding,
  type SiteContent,
} from './siteContent';
import {
  FALLBACK_LOGO_REFERENCE,
  FALLBACK_LOGO_URL,
  LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  resolveBundledLogoUrl,
  type LogoMimeType,
  type LogoReference,
} from './branding';

export {
  FALLBACK_LOGO_URL,
  LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  type LogoMimeType,
  type LogoReference,
};

/** Storage bucket created by supabase/migrations/005_branding_storage.sql. */
export const BRANDING_BUCKET = 'dine3d-branding';

const EXTENSION_BY_MIME: Record<LogoMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const SITE_CONTENT_ID = 'main';

/* ============================================================
   READING
   ============================================================ */

function fallbackReference(): LogoReference {
  return { ...FALLBACK_LOGO_REFERENCE };
}

/**
 * Derives the cache-busting token from the stored URL.
 *
 * Each upload is written under a fresh, never-reused object name, so the token
 * changes exactly when the asset does and nothing else. That matters: using the
 * `site_content.updated_at` timestamp instead would change the logo URL on every
 * unrelated text edit and force visitors to re-download an unchanged image.
 */
function versionFromUrl(url: string): string | null {
  if (!isManagedLogoUrl(url)) return null;

  const fileName = url.split('/').pop() ?? '';
  if (!fileName) return null;

  // Drop any query string so the token is stable.
  const clean = fileName.split('?')[0];
  return clean || null;
}

/** True when the URL points at an object this app manages in the branding bucket. */
export function isManagedLogoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return false;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${BRANDING_BUCKET}/`;
    return parsed.pathname.startsWith(marker);
  } catch {
    return false;
  }
}

/** Storage object name encoded in a managed logo URL, or null. */
function objectPathFromUrl(url: string): string | null {
  if (!isManagedLogoUrl(url)) return null;

  const parsed = new URL(url);
  const marker = `/storage/v1/object/public/${BRANDING_BUCKET}/`;
  return decodeURIComponent(parsed.pathname.slice(parsed.pathname.indexOf(marker) + marker.length));
}

function toReference(branding: Branding): LogoReference {
  const logoUrl = resolveBundledLogoUrl(branding.logoUrl);

  // The bundled asset is not owner-supplied, so its dimensions are the file's
  // real dimensions and never whatever an older row happens to hold. Without
  // this, a row written before the asset was cropped would reserve the box of
  // the file that no longer exists.
  const isBundled = logoUrl === FALLBACK_LOGO_URL;

  const dimensions = {
    // The schema already clamps these to sane integers, but an uploaded file's
    // measurements are owner-supplied, so never hand a nonsensical size to
    // next/image.
    width: clampDimension(
      isBundled ? FALLBACK_LOGO_REFERENCE.logoWidth : branding.logoWidth,
      FALLBACK_LOGO_REFERENCE.logoWidth
    ),
    height: clampDimension(
      isBundled ? FALLBACK_LOGO_REFERENCE.logoHeight : branding.logoHeight,
      FALLBACK_LOGO_REFERENCE.logoHeight
    ),
  };

  if (!isManagedLogoUrl(logoUrl)) {
    return {
      logoUrl,
      logoVersion: null,
      logoAlt: branding.logoAlt || 'Dine3D',
      logoWidth: dimensions.width,
      logoHeight: dimensions.height,
      hasCustomLogo: false,
    };
  }

  return {
    logoUrl,
    logoVersion: versionFromUrl(logoUrl),
    logoAlt: branding.logoAlt || 'Dine3D',
    logoWidth: dimensions.width,
    logoHeight: dimensions.height,
    hasCustomLogo: true,
  };
}

function clampDimension(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value as number);
  return rounded >= 1 && rounded <= 20000 ? rounded : fallback;
}

/* ============================================================
   READING
   ============================================================ */

interface SiteContentRow {
  draft: unknown;
  published: unknown;
}

async function readRow(): Promise<SiteContentRow | null> {
  assertSupabaseAdminConfigured();

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('draft, published')
    .eq('id', SITE_CONTENT_ID)
    .maybeSingle();

  if (error) throw error;
  return (data as any) ?? null;
}

function isEmptyDocument(value: unknown): boolean {
  if (!value || typeof value !== 'object') return true;
  return Object.keys(value as Record<string, unknown>).length === 0;
}

/**
 * The logo the public website should render.
 *
 * Never throws: if Supabase is unconfigured, migration 004 has not been applied,
 * or the bucket does not exist yet, the site falls back to the bundled asset
 * instead of failing to render.
 */
export async function getLogoReference(): Promise<LogoReference> {
  try {
    const row = await readRow();
    if (!row) return fallbackReference();

    const source = isEmptyDocument(row.published) ? row.draft : row.published;
    if (isEmptyDocument(source)) return fallbackReference();

    return toReference(normalizeSiteContent(source).branding);
  } catch {
    return fallbackReference();
  }
}

/* ============================================================
   WRITING
   ============================================================ */

/**
 * Points branding.logoUrl at a new file in both the draft and the published
 * document, inside the single existing row.
 *
 * `dimensions` are the real pixel size of the uploaded file, measured in the
 * browser before it was sent. They are stored alongside the URL so every logo
 * surface reserves the correct box without having to download the image first.
 *
 * `published` is left untouched when it is still empty, so replacing the logo
 * can never publish copy the owner has not explicitly published.
 */
export async function setLogoUrl(
  logoUrl: string,
  dimensions?: { width?: number; height?: number }
): Promise<LogoReference> {
  assertSupabaseAdminConfigured();

  const row = await readRow();
  const draft: SiteContent = isEmptyDocument(row?.draft)
    ? DEFAULT_SITE_CONTENT
    : normalizeSiteContent(row?.draft);

  // `null` rather than a parallel boolean, so the published patch below is
  // narrowed by the compiler instead of spreading a possibly-missing document.
  const published: SiteContent | null = isEmptyDocument(row?.published)
    ? null
    : normalizeSiteContent(row?.published);

  // A logo that is not a managed upload is the shipped asset, so it must use
  // the shipped asset's dimensions. Without this, removing an uploaded logo
  // would leave the fallback reserving the box of the file that was just
  // deleted.
  const isManaged = isManagedLogoUrl(logoUrl);

  const patchBranding = (source: SiteContent): Branding => ({
    ...source.branding,
    logoUrl,
    logoWidth: clampDimension(
      dimensions?.width ?? (isManaged ? source.branding.logoWidth : FALLBACK_LOGO_REFERENCE.logoWidth),
      FALLBACK_LOGO_REFERENCE.logoWidth
    ),
    logoHeight: clampDimension(
      dimensions?.height ??
        (isManaged ? source.branding.logoHeight : FALLBACK_LOGO_REFERENCE.logoHeight),
      FALLBACK_LOGO_REFERENCE.logoHeight
    ),
  });

  const nextDraft: SiteContent = { ...draft, branding: patchBranding(draft) };
  const nextPublished: SiteContent | null = published
    ? { ...published, branding: patchBranding(published) }
    : null;

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from('site_content').upsert(
    {
      id: SITE_CONTENT_ID,
      draft: nextDraft,
      // `undefined` leaves the column as-is instead of nulling it.
      ...(nextPublished ? { published: nextPublished } : {}),
      updated_at: now,
    },
    { onConflict: 'id' }
  );

  if (error) throw error;

  return toReference(nextDraft.branding);
}

/* ============================================================
   FILE VALIDATION
   ============================================================ */

/**
 * Identifies the real image type from the file's magic bytes.
 *
 * The browser-supplied `Content-Type` and filename extension are attacker
 * controlled, so they are only ever used as a hint. This is what actually
 * decides the stored MIME type, which means an uploaded `.exe` renamed to
 * `.png` cannot land in the bucket.
 *
 * Returns null for anything that is not a PNG, JPEG or WebP.
 */
export function sniffImageMime(buffer: Buffer): LogoMimeType | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => buffer[i] === byte)) return 'image/png';

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';

  // WebP: "RIFF" <4 byte size> "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export { formatBytes } from './branding';

/**
 * Generates the stored object name.
 *
 * The client's filename is deliberately discarded rather than sanitised and
 * reused: a random name cannot collide, cannot contain path separators, cannot
 * smuggle a double extension, and cannot overwrite an existing object.
 */
function buildObjectName(mime: LogoMimeType): string {
  const random = Math.random().toString(36).slice(2, 10);
  const entropy = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `site-logo-${Date.now().toString(36)}-${random}${entropy}.${EXTENSION_BY_MIME[mime]}`;
}

/* ============================================================
   STORAGE
   ============================================================ */

export interface StoredLogo {
  objectPath: string;
  publicUrl: string;
  version: string;
  bytes: number;
  mimeType: LogoMimeType;
}

/**
 * Thrown when the branding bucket is absent, which always means migration 005
 * has not been applied to the project.
 *
 * A dedicated type rather than a formatted string, so the route can answer with
 * the correct 503 status and an exact remediation. It is deliberately NOT
 * swallowed or auto-created: provisioning storage from a request handler would
 * hide a deployment step and let the migration system drift out of sync with
 * the database.
 */
export class MissingBrandingBucketError extends Error {
  readonly bucketId = BRANDING_BUCKET;
  readonly migrationFile = 'supabase/migrations/005_branding_storage.sql';

  constructor() {
    super(
      `Storage bucket "${BRANDING_BUCKET}" does not exist in this Supabase project. ` +
        `Apply ${'supabase/migrations/005_branding_storage.sql'} in the Supabase SQL Editor ` +
        `(Dashboard -> SQL Editor -> paste the file -> Run), then confirm with ` +
        `supabase/verify_branding_storage.sql. The migration is safe to re-run. ` +
        `Until then the site keeps using the bundled logo at public/images/dine3d-logo.png.`
    );
    this.name = 'MissingBrandingBucketError';
  }
}

/** True when an error means the branding bucket has not been provisioned. */
export function isMissingBrandingBucketError(error: unknown): boolean {
  return error instanceof MissingBrandingBucketError;
}

/** Uploads validated bytes and returns the public URL for them. */
export async function uploadLogo(buffer: Buffer, mime: LogoMimeType): Promise<StoredLogo> {
  assertSupabaseAdminConfigured();

  const objectPath = buildObjectName(mime);

  const { error } = await supabaseAdmin.storage.from(BRANDING_BUCKET).upload(objectPath, buffer, {
    contentType: mime,
    // Never overwrite: the random name makes this a no-op in practice, and
    // refusing to replace means a failed upload can never destroy the live logo.
    upsert: false,
    // The URL already changes on every upload, so it is safe to cache hard.
    cacheControl: '31536000',
  });

  if (error) {
    // Storage answers a missing bucket with "Bucket not found". That is an
    // infrastructure gap, not a bad file, so it gets its own actionable
    // message instead of being flattened into a generic upload failure.
    if (/bucket not found|not found.*bucket/i.test(error.message)) {
      throw new MissingBrandingBucketError();
    }

    throw new Error(`Could not upload the logo: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BRANDING_BUCKET).getPublicUrl(objectPath);

  return {
    objectPath,
    publicUrl: data.publicUrl,
    version: objectPath,
    bytes: buffer.length,
    mimeType: mime,
  };
}

/**
 * Removes an uploaded object.
 *
 * Failures are swallowed on purpose: an orphaned file costs storage but must not
 * make a successful "Remove Logo" look like an error to the owner.
 */
export async function deleteManagedLogo(logoUrl: string | null | undefined): Promise<boolean> {
  const objectPath = objectPathFromUrl(logoUrl ?? '');
  if (!objectPath) return false;

  try {
    const { error } = await supabaseAdmin.storage.from(BRANDING_BUCKET).remove([objectPath]);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}