// lib/menuModel.server.ts
//
// SERVER ONLY. Handles 3D model uploads for menu items (not the hero).
// Stores files in the same dine3d-models bucket, under a menu-items/ prefix.

import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  MAX_MODEL_BYTES,
  validateGlbBuffer,
  formatBytes,
} from './foodModel';

/** MIME types supported for menu item 3D models (broader than hero model). */
export type MenuModelMimeType =
  | 'model/gltf-binary'        // .glb
  | 'model/gltf+json'          // .gltf
  | 'model/vnd.usdz+zip'       // .usdz
  | 'model/obj'                // .obj
  | 'application/octet-stream'; // fallback for FBX, STL, PLY, 3DS, DAE, etc.

export const MENU_MODEL_BUCKET = 'dine3d-models';
export const MENU_MODEL_PREFIX = 'menu-items';

const SUPPORTED_MIME_TYPES: MenuModelMimeType[] = [
  'model/gltf-binary',
  'model/gltf+json',
  'model/vnd.usdz+zip',
  'model/obj',
  'application/octet-stream',
];

export function isSupportedModelMime(mime: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mime as MenuModelMimeType);
}

export function getModelExtension(mime: string): string {
  switch (mime) {
    case 'model/gltf-binary': return 'glb';
    case 'model/gltf+json': return 'gltf';
    case 'model/vnd.usdz+zip': return 'usdz';
    case 'model/obj': return 'obj';
    default: return 'glb';
  }
}

export function isViewableIn3D(mime: string): boolean {
  return mime === 'model/gltf-binary' || mime === 'model/vnd.usdz+zip';
}

export function buildMenuModelObjectName(menuItemId: string, mime: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  const entropy = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const ext = getModelExtension(mime);
  return `${MENU_MODEL_PREFIX}/${menuItemId}-${Date.now().toString(36)}-${random}${entropy}.${ext}`;
}

export async function uploadMenuModel(
  menuItemId: string,
  buffer: Buffer,
  mimeType: MenuModelMimeType
): Promise<{ objectPath: string; publicUrl: string; bytes: number; mimeType: MenuModelMimeType }> {
  assertSupabaseAdminConfigured();

  const objectPath = buildMenuModelObjectName(menuItemId, mimeType);

  const { error } = await supabaseAdmin.storage
    .from(MENU_MODEL_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) {
    if (/bucket not found|not found.*bucket/i.test(error.message)) {
      throw new Error(`The "${MENU_MODEL_BUCKET}" storage bucket does not exist. Apply supabase/migrations/006_food_model_storage.sql in the Supabase SQL editor, then upload the model again.`);
    }
    if (/exceeded the maximum allowed size|too large|413/i.test(error.message)) {
      throw new Error(`That model is larger than the bucket allows (${Math.floor(MAX_MODEL_BYTES / (1024 * 1024))} MiB).`);
    }
    throw new Error(`Could not upload the model: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(MENU_MODEL_BUCKET)
    .getPublicUrl(objectPath);

  return { objectPath, publicUrl: data.publicUrl, bytes: buffer.length, mimeType };
}

export async function deleteMenuModel(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${MENU_MODEL_BUCKET}/`;
    if (!parsed.pathname.startsWith(marker)) return false;

    const objectPath = decodeURIComponent(parsed.pathname.slice(parsed.pathname.indexOf(marker) + marker.length));
    if (!objectPath.startsWith(MENU_MODEL_PREFIX)) return false;

    const { error } = await supabaseAdmin.storage
      .from(MENU_MODEL_BUCKET)
      .remove([objectPath]);

    return !error;
  } catch {
    return false;
  }
}

export function sniffMenuModelMime(buffer: Buffer): MenuModelMimeType | null {
  // Try GLB validation first
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
  const glbResult = validateGlbBuffer(ab);
  if (glbResult.ok) return 'model/gltf-binary';

  // Check for USDZ (starts with PK for zip)
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
    return 'model/vnd.usdz+zip';
  }

  // Check for glTF JSON (starts with { or [)
  if (buffer.length >= 4) {
    const text = buffer.subarray(0, 100).toString('utf8').trim();
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        JSON.parse(text);
        return 'model/gltf+json';
      } catch {
        // Not valid JSON
      }
    }
  }

  // Check for OBJ (starts with #, v, f, or similar)
  if (buffer.length >= 4) {
    const text = buffer.subarray(0, 100).toString('utf8').trim();
    if (text.startsWith('#') || text.startsWith('v ') || text.startsWith('f ')) {
      return 'model/obj';
    }
  }

  // Default to octet-stream for other formats
  return 'application/octet-stream';
}

// Re-export for route handlers
export { MAX_MODEL_BYTES, formatBytes, validateGlbBuffer };