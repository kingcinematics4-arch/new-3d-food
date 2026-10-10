// lib/heroImage.server.ts
//
// SERVER ONLY. Everything that touches the hero background image file.
//
// NEVER import this from a client component: it reaches for the Supabase
// service-role key, which bypasses RLS and must never enter a browser bundle.
//
// DATA MODEL
// ----------
// There is no separate images table. The hero background-url reference lives
// inside the existing singleton `site_content` row (id = 'main'), in
// `hero.imageUrl`.
//
// The FILE itself lives in the public read-only storage bucket `dine3d-branding`
// (created by migration 005, broadened to accept every image format by
// migration 009). That bucket has a public SELECT policy and deliberately no
// INSERT / UPDATE / DELETE policy, so a browser cannot write to it even with a
// valid session. Writes only happen here, server-side.
//
// Object names for hero images are prefixed `hero-bg-` so they can be told apart
// from logo files (`site-logo-…`) that share the same bucket.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  DEFAULT_SITE_CONTENT,
  normalizeSiteContent,
  type SiteContent,
} from './siteContent';
import {
  ACCEPTED_HERO_IMAGE_LABEL,
  HERO_IMAGE_FILE_ACCEPT,
  HERO_IMAGE_MIME_TYPES,
  HERO_IMAGE_BUCKET,
  HERO_IMAGE_PREFIX,
  MAX_HERO_IMAGE_BYTES,
  isManagedHeroImageUrl,
  type HeroImageMimeType,
} from './heroImage';
import { formatBytes } from './branding';

export {
  ACCEPTED_HERO_IMAGE_LABEL,
  HERO_IMAGE_FILE_ACCEPT,
  HERO_IMAGE_MIME_TYPES,
  HERO_IMAGE_BUCKET,
  HERO_IMAGE_PREFIX,
  MAX_HERO_IMAGE_BYTES,
  formatBytes,
  isManagedHeroImageUrl,
  type HeroImageMimeType,
};

const EXTENSION_BY_MIME: Record<HeroImageMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/apng': 'apng',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

const SITE_CONTENT_ID = 'main';

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
 * The hero background image reference that the public site should use.
 *
 * Never throws: falls back to an empty reference when Supabase is unconfigured,
 * migration 004 has not been applied, or nothing has been uploaded.
 */
export async function getHeroImageReference(): Promise<{ imageUrl: string; isManaged: boolean }> {
  try {
    const row = await readRow();
    if (!row) return { imageUrl: '', isManaged: false };

    const source = isEmptyDocument(row.published) ? row.draft : row.published;
    if (isEmptyDocument(source)) return { imageUrl: '', isManaged: false };

    const hero = normalizeSiteContent(source).hero;
    const imageUrl = hero.imageUrl || '';
    return { imageUrl, isManaged: isManagedHeroImageUrl(imageUrl) };
  } catch {
    return { imageUrl: '', isManaged: false };
  }
}

/* ============================================================
   WRITING
   ============================================================ */

/**
 * Points `hero.imageUrl` at a new file (or clears it to empty) in both the
 * draft and the published document, inside the single existing row.
 *
 * `published` is left untouched when it is still empty, so replacing the
 * background image can never publish copy the owner has not explicitly published.
 */
export async function setHeroImageUrl(imageUrl: string | null): Promise<{ imageUrl: string; isManaged: boolean }> {
  assertSupabaseAdminConfigured();

  const row = await readRow();
  const draft: SiteContent = isEmptyDocument(row?.draft)
    ? DEFAULT_SITE_CONTENT
    : normalizeSiteContent(row?.draft);

  const published: SiteContent | null = isEmptyDocument(row?.published)
    ? null
    : normalizeSiteContent(row?.published);

  const nextUrl = imageUrl ? imageUrl.trim() : '';
  const isManaged = isManagedHeroImageUrl(nextUrl);

  const patchHero = (source: SiteContent): SiteContent['hero'] => ({
    ...source.hero,
    imageUrl: nextUrl,
  });

  const nextDraft: SiteContent = { ...draft, hero: patchHero(draft) };
  const nextPublished: SiteContent | null = published
    ? { ...published, hero: patchHero(published) }
    : null;

  const { error } = await supabaseAdmin.from('site_content').upsert(
    {
      id: SITE_CONTENT_ID,
      draft: nextDraft,
      ...(nextPublished ? { published: nextPublished } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw error;

  return { imageUrl: nextUrl, isManaged };
}

/* ============================================================
   FILE VALIDATION
   ============================================================ */

/**
 * Identifies the real image type from the file's magic bytes.
 *
 * The browser-supplied `Content-Type` and filename extension are attacker
 * controlled, so they are only ever a hint. This is what actually decides the
 * stored MIME type, which means an uploaded `.exe` renamed to `.png` cannot land
 * in the bucket.
 *
 * Supports: PNG, APNG, JPEG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC/HEIF, ICO.
 * Returns null for anything that is not a recognised image.
 */
export function sniffImageMime(buffer: Buffer): HeroImageMimeType | null {
  if (buffer.length < 12) return null;

  /* ---- PNG (signature shared with APNG) ---- */
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((byte, i) => buffer[i] === byte)) {
    // APNG shares the PNG signature but inserts an `acTL` (animation control)
    // chunk as the chunk immediately following IHDR. PNG layout:
    //   [8-byte sig][4-byte len]["IHDR"][13 bytes data][4-byte CRC]
    //   [4-byte len]["acTL"|"IDAT" ...]
    // The acTL type sits at offset 37-40.
    if (buffer.length >= 41) {
      const acTL = [0x61, 0x63, 0x54, 0x4c]; // "acTL"
      if (acTL.every((byte, i) => buffer[37 + i] === byte)) {
        return 'image/apng';
      }
    }
    return 'image/png';
  }

  /* ---- JPEG ---- */
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  /* ---- WebP ---- */
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  /* ---- GIF ---- */
  const gif = buffer.toString('ascii', 0, 6);
  if (gif === 'GIF87a' || gif === 'GIF89a') {
    return 'image/gif';
  }

  /* ---- BMP ---- */
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'image/bmp';
  }

  /* ---- TIFF ---- */
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return 'image/tiff';
  }

  /* ---- ISOBMFF container (AVIF, HEIC/HEIF) ---- */
  // [4-byte box size][4-byte "ftyp"][4-byte major brand][4-byte minor version]
  if (buffer.length >= 16 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const major = buffer.toString('ascii', 8, 12);
    const minor = buffer.toString('ascii', 12, 16);

    const brands = [major, minor];
    if (buffer.length >= 20) {
      brands.push(buffer.toString('ascii', 16, 20));
    }

    for (const brand of brands) {
      if (brand === 'avif' || brand === 'avis') return 'image/avif';
      if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'mif1' || brand === 'msf1') {
        return 'image/heic';
      }
    }
  }

  /* ---- SVG ---- */
  const head = buffer.toString('utf8', 0, 32).trim();
  if (head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<svg ')) {
    return 'image/svg+xml';
  }

  /* ---- ICO ---- */
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'image/vnd.microsoft.icon';
  }

  return null;
}

/* ============================================================
   STORAGE
   ============================================================ */

export interface StoredHeroImage {
  objectPath: string;
  publicUrl: string;
  version: string;
  bytes: number;
  mimeType: HeroImageMimeType;
}

/**
 * Generates the stored object name for a hero background image.
 *
 * The client's filename is deliberately discarded: a random name cannot collide,
 * cannot contain path separators, cannot smuggle a double extension, and cannot
 * overwrite an existing object. The `hero-bg-` prefix distinguishes hero images
 * from logo files in the shared bucket.
 */
function buildHeroObjectName(mime: HeroImageMimeType): string {
  const random = Math.random().toString(36).slice(2, 10);
  const entropy = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `hero-bg-${Date.now().toString(36)}-${random}${entropy}.${EXTENSION_BY_MIME[mime]}`;
}

/** Uploads validated bytes and returns the public URL for them. */
export async function uploadHeroImage(buffer: Buffer, mime: HeroImageMimeType): Promise<StoredHeroImage> {
  assertSupabaseAdminConfigured();

  const objectPath = buildHeroObjectName(mime);

  const { error } = await supabaseAdmin.storage.from(HERO_IMAGE_BUCKET).upload(objectPath, buffer, {
    contentType: mime,
    upsert: false,
    cacheControl: '31536000',
  });

  if (error) {
    if (/bucket not found|not found.*bucket/i.test(error.message)) {
      throw new MissingHeroImageBucketError();
    }

    throw new Error(`Could not upload the hero image: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(HERO_IMAGE_BUCKET).getPublicUrl(objectPath);

  return {
    objectPath,
    publicUrl: data.publicUrl,
    version: objectPath,
    bytes: buffer.length,
    mimeType: mime,
  };
}

/**
 * Removes a previously uploaded hero image.
 *
 * Best-effort by design: a failed cleanup is an orphaned object, which costs
 * storage but breaks nothing. It must never be allowed to fail the request that
 * replaced the image.
 */
export async function deleteManagedHeroImage(url: string | null | undefined): Promise<boolean> {
  if (!isManagedHeroImageUrl(url)) return false;

  const parsed = new URL(url!);
  const marker = `/storage/v1/object/public/${HERO_IMAGE_BUCKET}/`;
  const objectPath = decodeURIComponent(parsed.pathname.slice(parsed.pathname.indexOf(marker) + marker.length));

  try {
    const { error } = await supabaseAdmin.storage.from(HERO_IMAGE_BUCKET).remove([objectPath]);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Thrown when the branding bucket is absent, which means migration 005 + 009
 * have not been applied to the project.
 */
export class MissingHeroImageBucketError extends Error {
  readonly bucketId = HERO_IMAGE_BUCKET;

  constructor() {
    super(
      `Storage bucket "${HERO_IMAGE_BUCKET}" does not exist in this Supabase project. ` +
        `Apply supabase/migrations/009_branding_image_formats.sql in the Supabase SQL Editor, ` +
        `then upload the image again.`
    );
    this.name = 'MissingHeroImageBucketError';
  }
}

export function isMissingHeroImageBucketError(error: unknown): boolean {
  return error instanceof MissingHeroImageBucketError;
}
