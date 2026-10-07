// app/api/menu/3d-model/route.ts
//
// Upload / delete 3D models for menu items.
// Only the dish's owning hotel can upload. Browser never sees the service-role key.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import {
  MENU_MODEL_BUCKET,
  MENU_MODEL_PREFIX,
  MAX_MODEL_BYTES,
  uploadMenuModel,
  deleteMenuModel,
  isSupportedModelMime,
  isViewableIn3D,
  sniffMenuModelMime,
  formatBytes,
  validateGlbBuffer,
} from '@/lib/menuModel.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: NO_STORE });
}

/**
 * POST /api/menu/3d-model
 *
 * Multipart body with:
 *   - `file` (File) — the 3D model
 *   - `menu_item_id` (string) — the dish this model belongs to
 *
 * Accepts GLB, GLTF, USDZ, OBJ, and other formats. Only GLB/USDZ are viewable
 * in the 3D viewer; others are stored but will show a "3D unavailable" placeholder.
 */
export async function POST(request: Request) {
  const access = await requireOwnedHotelId(null);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  let file: File | null = null;
  let menuItemId = '';

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return fail('Send the model as multipart/form-data with "file" and "menu_item_id" fields.', 415);
    }

    const form = await request.formData();
    const candidate = form.get('file');
    if (!candidate || typeof candidate === 'string') {
      return fail('No file was received. Choose a 3D model file and try again.', 400);
    }
    file = candidate;

    const id = form.get('menu_item_id');
    if (typeof id !== 'string' || !id.trim()) {
      return fail('menu_item_id is required.', 400);
    }
    menuItemId = id.trim();
  } catch {
    return fail('Could not read the upload. Try again with a smaller file.', 400);
  }

  if (file.size === 0) return fail('That file is empty.', 400);
  if (file.size > MAX_MODEL_BYTES) {
    return fail(`That model is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_MODEL_BYTES)}.`, 413);
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return fail('Could not read the uploaded file.', 400);
  }

  // Verify ownership of the menu item
  const { data: menuItem, error: itemError } = await supabaseAdmin
    .from('menu_items')
    .select('id, hotel_id')
    .eq('id', menuItemId)
    .single();

  if (itemError || !menuItem) return fail('Dish not found.', 404);
  if (menuItem.hotel_id !== access.hotelId) return fail('You can only upload models for your own dishes.', 403);

  // Determine MIME type from magic bytes
  const mimeType = sniffMenuModelMime(buffer);
  if (!mimeType || !isSupportedModelMime(mimeType)) {
    return fail('That file type is not supported. Upload a GLB, GLTF, USDZ, OBJ, FBX, STL, PLY, 3DS, or DAE file.', 415);
  }

  // Validate GLB if that's what we got
  if (mimeType === 'model/gltf-binary') {
    const ab = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(ab).set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
    const validated = validateGlbBuffer(ab);
    if (!validated.ok) {
      return fail(validated.error, validated.reason === 'too-large' ? 413 : 400);
    }
  }

  let stored;
  try {
    stored = await uploadMenuModel(menuItemId, buffer, mimeType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  // Update the menu item with the new model URL
  const { error: updateError } = await supabaseAdmin
    .from('menu_items')
    .update({
      model_url_glb: mimeType === 'model/gltf-binary' ? stored.publicUrl : null,
      model_url_usdz: mimeType === 'model/vnd.usdz+zip' ? stored.publicUrl : null,
    })
    .eq('id', menuItemId);

  if (updateError) {
    // Clean up orphaned file
    await deleteMenuModel(stored.publicUrl);
    return fail(`Could not save the model reference: ${updateError.message}`, 500);
  }

  return NextResponse.json(
    {
      success: true,
      model: {
        url: stored.publicUrl,
        mimeType: stored.mimeType,
        bytes: stored.bytes,
        isViewable: isViewableIn3D(stored.mimeType),
      },
    },
    { headers: NO_STORE }
  );
}

/**
 * DELETE /api/menu/3d-model?menu_item_id=...
 *
 * Removes the uploaded model and clears the reference from the menu item.
 */
export async function DELETE(request: Request) {
  const access = await requireOwnedHotelId(null);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  const { searchParams } = new URL(request.url);
  const menuItemId = searchParams.get('menu_item_id');
  if (!menuItemId) return fail('menu_item_id is required.', 400);

  // Verify ownership
  const { data: menuItem, error: itemError } = await supabaseAdmin
    .from('menu_items')
    .select('id, hotel_id, model_url_glb, model_url_usdz')
    .eq('id', menuItemId)
    .single();

  if (itemError || !menuItem) return fail('Dish not found.', 404);
  if (menuItem.hotel_id !== access.hotelId) return fail('You can only remove models from your own dishes.', 403);

  let removedAny = false;
  for (const url of [menuItem.model_url_glb, menuItem.model_url_usdz].filter(Boolean)) {
    if (url && (await deleteMenuModel(url))) removedAny = true;
  }

  const { error: updateError } = await supabaseAdmin
    .from('menu_items')
    .update({ model_url_glb: null, model_url_usdz: null })
    .eq('id', menuItemId);

  if (updateError) return fail(`Could not clear model reference: ${updateError.message}`, 500);

  return NextResponse.json(
    { success: true, removedFile: removedAny, message: removedAny ? 'Model removed.' : 'No uploaded model to remove.' },
    { headers: NO_STORE }
  );
}