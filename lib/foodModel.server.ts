// lib/foodModel.server.ts
//
// SERVER ONLY. Everything that touches the uploaded hero 3D food model file.
//
// NEVER import this from a client component: it reaches for the Supabase
// service-role key, which bypasses RLS and must never enter a browser bundle.
//
// DATA MODEL
// ----------
// There is no separate models table. The reference lives inside the existing
// singleton `site_content` row (id = 'main'), in `hero.modelUrlGlb` and
// `hero.modelName`.
//
// The FILE itself lives in the public read-only storage bucket `dine3d-models`
// (migration 006). That bucket has a public SELECT policy and deliberately no
// INSERT / UPDATE / DELETE policy, so a browser cannot write to it even with a
// valid session. Writes only happen here, server-side.
//
// REPLACEMENT SEMANTICS
// ---------------------
// Replacing the model rewrites `hero.modelUrlGlb` in BOTH the draft and the
// published document inside the same row, so the new dish is live immediately
// without the owner having to remember a separate publish step — the same
// treatment the logo gets, and for the same reason: a binary asset that has just
// been uploaded and validated is not "unpublished copy" that needs review.
// `published` is only touched when it already has content, so this can never
// accidentally publish unrelated unpublished text.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  DEFAULT_SITE_CONTENT,
  normalizeSiteContent,
  type SiteContent,
} from './siteContent';
import {
  EMPTY_FOOD_MODEL,
  MAX_MODEL_BYTES,
  MODEL_FILE_EXTENSION,
  MODEL_MIME_TYPES,
  validateGlbBuffer,
  type FoodModelReference,
  type ModelMimeType,
} from './foodModel';

export {
  EMPTY_FOOD_MODEL,
  MAX_MODEL_BYTES,
  MODEL_FILE_ACCEPT,
  MODEL_FILE_EXTENSION,
  MODEL_MIME_TYPES,
  ACCEPTED_MODEL_LABEL,
  formatBytes,
  isAcceptableModelFile,
  validateGlbBuffer,
  type FoodModelReference,
  type ModelMimeType,
} from './foodModel';

/** Storage bucket created by supabase/migrations/006_food_model_storage.sql. */
export const FOOD_MODEL_BUCKET = 'dine3d-models';

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

/** True when the URL points at an object this app manages in the models bucket. */
export function isManagedModelUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return false;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${FOOD_MODEL_BUCKET}/`;
    return parsed.pathname.startsWith(marker);
  } catch {
    return false;
  }
}

/**
 * Derives the cache-busting token from the stored URL.
 *
 * Every upload is written under a fresh, never-reused object name, so the token
 * changes exactly when the asset does and nothing else. Using
 * `site_content.updated_at` instead would change the model URL on every unrelated
 * hero text edit and force every visitor to re-download an unchanged GLB.
 */
function versionFromUrl(url: string | null | undefined): string | null {
  if (!isManagedModelUrl(url)) return null;

  const fileName = url?.split('/').pop() ?? '';
  if (!fileName) return null;

  return fileName.split('?')[0] || null;
}

function toReference(hero: SiteContent['hero']): FoodModelReference {
  const modelUrlGlb = hero.modelUrlGlb?.trim() || null;

  if (!modelUrlGlb) return { ...EMPTY_FOOD_MODEL };

  return {
    modelUrlGlb,
    modelVersion: versionFromUrl(modelUrlGlb),
    modelName: hero.modelName?.trim() || '',
  };
}

/**
 * The model the public hero should render.
 *
 * Never throws: if Supabase is unconfigured, migration 004 has not been applied,
 * or nothing has ever been uploaded, this returns an empty reference and the
 * viewer falls back to the bundled demonstration dish. A visitor must never see
 * a broken hero because a storage bucket is missing.
 */
export async function getFoodModelReference(): Promise<FoodModelReference> {
  try {
    const row = await readRow();
    if (!row) return { ...EMPTY_FOOD_MODEL };

    const source = isEmptyDocument(row.published) ? row.draft : row.published;
    if (isEmptyDocument(source)) return { ...EMPTY_FOOD_MODEL };

    return toReference(normalizeSiteContent(source).hero);
  } catch {
    return { ...EMPTY_FOOD_MODEL };
  }
}

/* ============================================================
   WRITING
   ============================================================ */

/**
 * Points `hero.modelUrlGlb` at a new file (or clears it) in both the draft and
 * the published document, inside the single existing row.
 */
export async function setHeroModelUrl(
  modelUrlGlb: string | null,
  modelName = ''
): Promise<FoodModelReference> {
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

  const patchHero = (source: SiteContent): SiteContent['hero'] => ({
    ...source.hero,
    modelUrlGlb: modelUrlGlb ?? '',
    modelName: modelUrlGlb ? modelName : '',
  });

  const nextDraft: SiteContent = { ...draft, hero: patchHero(draft) };
  const nextPublished: SiteContent | null = published
    ? { ...published, hero: patchHero(published) }
    : null;

  const { error } = await supabaseAdmin.from('site_content').upsert(
    {
      id: SITE_CONTENT_ID,
      draft: nextDraft,
      // `undefined` leaves the column as-is instead of nulling it.
      ...(nextPublished ? { published: nextPublished } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw error;

  return toReference(nextDraft.hero);
}

/* ============================================================
   FILE VALIDATION
   ============================================================ */

/**
 * Identifies the real model type from the file's magic bytes.
 *
 * The browser-supplied `Content-Type` and filename extension are attacker
 * controlled, so they are only ever a hint. This is what actually decides the
 * stored MIME type, which means an uploaded `.exe` renamed to `.glb` cannot land
 * in the bucket.
 *
 * Returns null for anything that is not a glTF 2.0 binary.
 */
export function sniffModelMime(buffer: Buffer): ModelMimeType | null {
  // A Node Buffer is a Uint8Array, so the exact same header parser the browser
  // uses can be reused. `validateGlbBuffer` additionally enforces the declared
  // version and total length, which is what catches a truncated file.
  const result = validateGlbBuffer(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );

  return result.ok ? MODEL_MIME_TYPES[0] : null;
}

/**
 * Generates the stored object name.
 *
 * The client's filename is deliberately discarded rather than sanitised and
 * reused: a random name cannot collide, cannot contain path separators, cannot
 * smuggle a double extension, and cannot overwrite an existing object.
 */
function buildObjectName(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const entropy = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return `hero-food-${Date.now().toString(36)}-${random}${entropy}.${MODEL_FILE_EXTENSION}`;
}

/* ============================================================
   STORAGE
   ============================================================ */

export interface StoredFoodModel {
  objectPath: string;
  publicUrl: string;
  version: string;
  bytes: number;
  mimeType: ModelMimeType;
}

/**
 * Thrown when the models bucket is absent, which always means migration 006 has
 * not been applied to the project.
 *
 * A dedicated type rather than a formatted string, so the route can answer with
 * the correct 503 status and an exact remediation. Deliberately NOT swallowed or
 * auto-created: provisioning storage from a request handler would hide a
 * deployment step and let migrations drift out of sync with the database.
 */
export class MissingFoodModelBucketError extends Error {
  readonly bucketId = FOOD_MODEL_BUCKET;
  readonly migrationFile = 'supabase/migrations/006_food_model_storage.sql';

  constructor() {
    super(
      `The "${FOOD_MODEL_BUCKET}" storage bucket does not exist. Apply ${this.migrationFile} in the Supabase SQL editor, then upload the model again.`
    );
    this.name = 'MissingFoodModelBucketError';
  }
}

export function isMissingFoodModelBucketError(error: unknown): boolean {
  return error instanceof MissingFoodModelBucketError;
}

export async function uploadFoodModel(
  buffer: Buffer,
  mimeType: ModelMimeType
): Promise<StoredFoodModel> {
  assertSupabaseAdminConfigured();

  const objectPath = buildObjectName();

  const { error } = await supabaseAdmin.storage
    .from(FOOD_MODEL_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      // Never overwrite: the random name makes this a no-op in practice, and
      // refusing to replace means a failed upload can never destroy the live
      // model.
      upsert: false,
      // The URL already changes on every upload, so it is safe to cache hard.
      // This is the single biggest lever on landing-page performance: without a
      // long-lived cache a visitor re-downloads the whole model on every visit.
      cacheControl: '31536000',
    });

  if (error) {
    // Storage answers a missing bucket with "Bucket not found". That is an
    // infrastructure gap, not a bad file, so it gets its own actionable message
    // instead of being flattened into a generic upload failure.
    if (/bucket not found|not found.*bucket/i.test(error.message)) {
      throw new MissingFoodModelBucketError();
    }

    // The bucket's own `file_size_limit` / `allowed_mime_types` are enforced
    // here too. Translate them rather than leaking a Storage message.
    if (/exceeded the maximum allowed size|too large|413/i.test(error.message)) {
      throw new Error(
        `That model is larger than the ${FOOD_MODEL_BUCKET} bucket allows (${Math.floor(
          MAX_MODEL_BYTES / (1024 * 1024)
        )} MiB).`
      );
    }

    throw new Error(`Could not upload the model: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(FOOD_MODEL_BUCKET)
    .getPublicUrl(objectPath);

  return {
    objectPath,
    publicUrl: data.publicUrl,
    version: objectPath,
    bytes: buffer.length,
    mimeType,
  };
}

/** Storage object name encoded in a managed model URL, or null. */
function objectPathFromUrl(url: string): string | null {
  if (!isManagedModelUrl(url)) return null;

  const parsed = new URL(url);
  const marker = `/storage/v1/object/public/${FOOD_MODEL_BUCKET}/`;
  return decodeURIComponent(
    parsed.pathname.slice(parsed.pathname.indexOf(marker) + marker.length)
  );
}

/**
 * Removes a previously uploaded model.
 *
 * Best-effort by design: a failed cleanup is an orphaned object, which costs
 * storage but breaks nothing. It must never be allowed to fail the request that
 * replaced the model, so it swallows its error and reports the outcome.
 */
export async function deleteManagedModel(url: string | null | undefined): Promise<boolean> {
  if (!isManagedModelUrl(url)) return false;

  const objectPath = objectPathFromUrl(url as string);
  if (!objectPath) return false;

  try {
    const { error } = await supabaseAdmin.storage
      .from(FOOD_MODEL_BUCKET)
      .remove([objectPath]);

    return !error;
  } catch {
    return false;
  }
}
