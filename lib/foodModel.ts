// lib/foodModel.ts
//
// The Dine3D hero food model: shared, dependency-free constants and types.
//
// Deliberately free of Supabase, `next/headers` and `server-only` so it can be
// imported from route handlers, server components AND client components. The
// storage code lives separately in `lib/foodModel.server.ts`, which must never be
// pulled into a browser bundle.
//
// SCOPE
// -----
// This is the 3D asset the LANDING PAGE hero shows — the single dish a visitor
// sees on the first screen. It is not the same thing as a restaurant's own dish
// models in `menu_items.model_url_glb`, which stay URL-only and are rendered by
// `components/3d/FoodModelViewer.tsx`.

/* ============================================================
   FORMAT
   ============================================================ */

/**
 * 25 MiB.
 *
 * Mirrored by `file_size_limit` on the `dine3d-models` bucket, so an oversized
 * upload is rejected by Storage as well as by this app.
 *
 * 25 MiB is a deliberate ceiling rather than a round number that felt safe. A
 * hero model is downloaded by EVERY visitor before the first frame is
 * interactive, so it is the single heaviest asset on the page. A textured food
 * model exported from a decent DCC tool lands between 2 and 12 MiB; a 25 MiB
 * budget leaves real headroom for a detailed dish while still refusing the
 * accidental 200 MiB scene export that would wreck the page for everyone.
 */
export const MAX_MODEL_BYTES = 25 * 1024 * 1024;

export const MODEL_MIME_TYPES = ['model/gltf-binary'] as const;
export type ModelMimeType = (typeof MODEL_MIME_TYPES)[number];

/** Short label reused by every validation message and hint. */
export const ACCEPTED_MODEL_LABEL = 'GLB';

/**
 * What the file picker offers.
 *
 * Only `.glb`. `.gltf` is deliberately NOT accepted, and that is a correctness
 * decision rather than an omission:
 *
 * A `.gltf` file is JSON. Its geometry lives in one or more sibling `.bin`
 * files and its textures in sibling image files, referenced by relative URI. It
 * is a manifest, not a self-contained asset. Uploading just the `.gltf` would
 * store a file whose every buffer and texture 404s on the landing page, and
 * there is no way to accept the sidecar files through a single-file upload.
 *
 * The fix is a one-click export in Blender, Maya or whatever produced the model
 * ("glTF Binary (.glb)"), which is also what Draco and KTX2 compression require.
 * `gltfpack`/`gltf-transform` can be used to shrink and compress it afterwards.
 */
export const MODEL_FILE_ACCEPT = '.glb,model/gltf-binary';

/** Extension the stored object gets. */
export const MODEL_FILE_EXTENSION = 'glb';

/* ============================================================
   GLB CONTAINER FORMAT
   ============================================================ */

/**
 * Every `.glb` opens with a 12-byte header:
 *
 *   bytes  0–3   magic, the ASCII string "glTF"
 *   bytes  4–7   version, little-endian uint32 (2 for glTF 2.0)
 *   bytes  8–11  total file length in bytes, little-endian uint32
 *
 * Validating all three is what separates "this is a real GLB" from "this file
 * merely ends in .glb". The declared length is the useful one: it is written by
 * the exporter and must equal the real file size, so a mismatch means the file
 * was truncated in transfer or corrupted on disk. That is caught here, for free,
 * before a single byte is sent to storage — and it produces a specific message
 * instead of an opaque "unexpected end of JSON stream" from the parser later.
 */
export const GLB_HEADER_BYTES = 12;

const GLB_MAGIC = 0x46546c67; // 'g','l','T','F' read as a little-endian uint32.
const GLB_VERSION = 2;

/* ============================================================
   VALIDATION
   ============================================================ */

/** Why a file was refused. Every member maps to one specific, actionable message. */
export type ModelRejectionReason =
  | 'empty'
  | 'too-large'
  | 'wrong-extension'
  | 'wrong-magic'
  | 'unsupported-version'
  | 'length-mismatch';

export interface ModelValidationFailure {
  ok: false;
  reason: ModelRejectionReason;
  error: string;
}

export type ModelValidationResult = { ok: true; declaredBytes: number } | ModelValidationFailure;

function fail(reason: ModelRejectionReason, error: string): ModelValidationFailure {
  return { ok: false, reason, error };
}

/**
 * Reads the 12-byte GLB header out of the first bytes of a file.
 *
 * Takes an `ArrayBuffer` rather than a `File` so the same function validates a
 * browser-selected file and a server-side Buffer, and so the browser path can
 * validate from a cheap 12-byte slice without loading the whole file into memory
 * twice.
 */
export function readGlbHeader(source: ArrayBuffer): {
  magic: number;
  version: number;
  declaredBytes: number;
} | null {
  if (source.byteLength < GLB_HEADER_BYTES) return null;

  const view = new DataView(source);
  return {
    magic: view.getUint32(0, true),
    version: view.getUint32(4, true),
    declaredBytes: view.getUint32(8, true),
  };
}

/**
 * Decides whether a GLB header plus a real file size describes a loadable
 * glTF 2.0 binary.
 *
 * Split out from `validateGlbBuffer` so the browser can check a picked file
 * without loading it: the header only needs the first 12 bytes, but the length
 * consistency check needs the true file size, which `File.size` provides for
 * free. Passing the slice itself to the full-buffer check would compare the
 * declared length against 12 bytes and reject every valid file.
 */
export function validateGlbHeader(
  header: { magic: number; version: number; declaredBytes: number } | null,
  actualBytes: number
): ModelValidationResult {
  if (actualBytes === 0) {
    return fail('empty', 'That file is empty.');
  }

  if (actualBytes > MAX_MODEL_BYTES) {
    return fail(
      'too-large',
      `That model is ${formatBytes(actualBytes)}. The maximum is ${formatBytes(MAX_MODEL_BYTES)}.`
    );
  }

  if (!header) {
    return fail(
      'wrong-magic',
      'That file is too short to be a 3D model. Export it as a GLB file and try again.'
    );
  }

  if (header.magic !== GLB_MAGIC) {
    return fail(
      'wrong-magic',
      `That is not a 3D model. A ${ACCEPTED_MODEL_LABEL} file starts with the characters "glTF" — this file does not. If you have a .gltf file, re-export it as .glb.`
    );
  }

  if (header.version !== GLB_VERSION) {
    return fail(
      'unsupported-version',
      `That model uses glTF version ${header.version}. Only glTF 2.0 (GLB) is supported — re-export it from your 3D software.`
    );
  }

  // A declared length that disagrees with the real size means a corrupt or
  // truncated file. GLTFLoader would otherwise fail deep inside the parser with
  // an unhelpful message; catching it here produces something actionable.
  if (header.declaredBytes !== actualBytes) {
    return fail(
      'length-mismatch',
      `That file is damaged or incomplete — it declares ${formatBytes(header.declaredBytes)} but is actually ${formatBytes(actualBytes)}. Export it again and upload the finished file.`
    );
  }

  return { ok: true, declaredBytes: header.declaredBytes };
}

/**
 * Decides whether a complete buffer is a loadable glTF 2.0 binary.
 *
 * The extension and the browser's `Content-Type` are both attacker-controlled
 * and are never trusted here. Only the bytes decide.
 */
export function validateGlbBuffer(buffer: ArrayBuffer): ModelValidationResult {
  return validateGlbHeader(readGlbHeader(buffer), buffer.byteLength);
}

/**
 * Client-side pre-check, so an obviously wrong file is refused instantly without
 * an upload round trip.
 *
 * The upload route re-validates the real bytes; this is a convenience layer only.
 * The header is read from a 12-byte slice rather than the whole file, so picking
 * a 200 MiB scene costs nothing.
 */
export async function isAcceptableModelFile(file: File): Promise<ModelValidationResult> {
  if (file.size === 0) {
    return fail('empty', 'That file is empty.');
  }

  if (file.size > MAX_MODEL_BYTES) {
    return fail(
      'too-large',
      `That model is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_MODEL_BYTES)}.`
    );
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith('.glb')) {
    return fail(
      'wrong-extension',
      `Choose a ${ACCEPTED_MODEL_LABEL} file. In your 3D software this is the "glTF Binary (.glb)" export — a .gltf file will not work because it needs separate texture and geometry files.`
    );
  }

  let headerSlice: ArrayBuffer;
  try {
    headerSlice = await file.slice(0, GLB_HEADER_BYTES).arrayBuffer();
  } catch {
    return fail('wrong-magic', 'That file could not be read. Try choosing it again.');
  }

  // The header comes from the 12-byte slice; the length check must use the real
  // file size, so both are passed in separately.
  return validateGlbHeader(readGlbHeader(headerSlice), file.size);
}

/* ============================================================
   SHAPE
   ============================================================ */

export interface FoodModelReference {
  /** Absolute Supabase URL when uploaded, otherwise null for "no uploaded model". */
  modelUrlGlb: string | null;
  /**
   * Opaque token that changes every time the model file changes. Appended as
   * `?v=` so browsers and CDNs refetch the new asset instead of serving the
   * previously cached one.
   */
  modelVersion: string | null;
  /** What the visitor is looking at, for alt text and for the admin panel. */
  modelName: string;
}

export const EMPTY_FOOD_MODEL: FoodModelReference = {
  modelUrlGlb: null,
  modelVersion: null,
  modelName: '',
};

/**
 * Appends the cache-busting token to a model URL.
 *
 * The token matters more here than for an image. A GLB is a multi-megabyte
 * download that browsers and CDNs cache aggressively; without a changing token,
 * replacing the dish on the admin panel would keep serving the previous model to
 * every visitor who had already loaded the page.
 */
export function withModelCacheBust(
  url: string | null | undefined,
  version: string | null | undefined
): string {
  if (!url || !version) return url ?? '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
