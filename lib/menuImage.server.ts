import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  MAX_MENU_IMAGE_BYTES,
  MENU_IMAGE_MIME_TYPES,
  type MenuImageMimeType,
} from '@/lib/menuImage';

const MAGIC_BYTES: Record<MenuImageMimeType, Uint8Array[]> = {
  'image/png': [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/jpeg': [new Uint8Array([0xff, 0xd8, 0xff])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46]), new Uint8Array([0x57, 0x45, 0x42, 0x50])],
  'image/gif': [new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
  'image/bmp': [new Uint8Array([0x42, 0x4d])],
  'image/tiff': [new Uint8Array([0x49, 0x49, 0x2a, 0x00]), new Uint8Array([0x4d, 0x4d, 0x00, 0x2a])],
  'image/svg+xml': [new Uint8Array([0x3c, 0x3f, 0x78, 0x6d, 0x6c]), new Uint8Array([0x3c, 0x73, 0x76, 0x67])],
  'image/avif': [new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])],
  'image/heic': [new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63])],
  'image/heif': [new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x66])],
  'image/apng': [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/x-icon': [new Uint8Array([0x00, 0x00, 0x01, 0x00])],
  'image/vnd.microsoft.icon': [new Uint8Array([0x00, 0x00, 0x01, 0x00])],
};

function detectMimeType(buffer: Uint8Array): MenuImageMimeType | null {
  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (buffer.length >= sig.length && sig.every((byte, i) => buffer[i] === byte)) {
        return mime as MenuImageMimeType;
      }
    }
  }
  return null;
}

function generateDishPhotoPath(menuItemId: string, mimeType: MenuImageMimeType): string {
  const ext = mimeType.split('/')[1];
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `dish-photos/${menuItemId}/${timestamp}-${random}.${ext}`;
}

export async function uploadMenuImage(
  menuItemId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error('File is empty');
  }
  if (buffer.length > MAX_MENU_IMAGE_BYTES) {
    throw new Error(`File exceeds ${MAX_MENU_IMAGE_BYTES} bytes limit`);
  }

  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    throw new Error('Unsupported or unrecognised image format');
  }
  if (!MENU_IMAGE_MIME_TYPES.includes(detectedMime)) {
    throw new Error('Image format not allowed');
  }

  const supabase = supabaseAdmin;
  const path = generateDishPhotoPath(menuItemId, detectedMime);

  const { error } = await supabase.storage.from('dine3d-branding').upload(path, buffer, {
    contentType: detectedMime,
    upsert: false,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('dine3d-branding').getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Failed to generate public URL');
  }

  return { url: data.publicUrl, path };
}

export async function deleteMenuImage(path: string): Promise<void> {
  const supabase = supabaseAdmin;
  const { error } = await supabase.storage.from('dine3d-branding').remove([path]);
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}