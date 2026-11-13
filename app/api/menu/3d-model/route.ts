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
 *   - `model_type` (optional: "glb" | "usdz") — explicit target slot
 *
 * Supports independent GLB (3D viewer / Android AR) and USDZ (Apple AR Quick Look)
 * assets for the same product. Uploading one format does not remove the other.
 */
export async function POST(request: Request) {
  const access = await requireOwnedHotelId(null);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  let file: File | null = null;
  let menuItemId = '';
  let requestedType: 'glb' | 'usdz' | null = null;

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

    const typeField = form.get('model_type');
    if (typeof typeField === 'string') {
      const t = typeField.trim().toLowerCase();
      if (t === 'glb' || t === 'usdz') requestedType = t;
    }
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

  // Verify ownership and read existing model URLs so we can replace one slot
  // independently without removing the other.
  const { data: menuItem, error: itemError } = await supabaseAdmin
    .from('menu_items')
    .select('id, hotel_id, model_url_glb, model_url_usdz')
    .eq('id', menuItemId)
    .single();

  if (itemError || !menuItem) return fail('Dish not found.', 404);
  if (menuItem.hotel_id !== access.hotelId) return fail('You can only upload models for your own dishes.', 403);

  // Determine MIME type from magic bytes
  const mimeType = sniffMenuModelMime(buffer);
  if (!mimeType || !isSupportedModelMime(mimeType)) {
    return fail('That file type is not supported. Upload a self-contained GLB or a genuine USDZ file.', 415);
  }

  // Enforce genuine, cross-platform AR asset formats.
  if (mimeType === 'model/gltf+json') {
    return fail(
      'GLTF (.gltf) files with external textures or buffers cannot be uploaded as a single file. Export a self-contained GLB (embedded geometry/materials/textures) for 3D/Android AR, and provide a matching genuine USDZ for Apple Quick Look.',
      415
    );
  }
  if (mimeType !== 'model/gltf-binary' && mimeType !== 'model/vnd.usdz+zip') {
    return fail(
      'For AR delivery, upload a self-contained GLB (Android AR / 3D viewer) or a genuine USDZ (Apple Quick Look). Other formats are not accepted for this workflow.',
      415
    );
  }

  if (requestedType === 'glb' && mimeType !== 'model/gltf-binary') {
    return fail('The selected GLB slot requires a valid self-contained .glb file.', 415);
  }
  if (requestedType === 'usdz' && mimeType !== 'model/vnd.usdz+zip') {
    return fail('The selected USDZ slot requires a genuine .usdz file. Renaming a GLB to USDZ is not a valid conversion.', 415);
  }

  // Validate GLB structure/content
  if (mimeType === 'model/gltf-binary') {
    const ab = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(ab).set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
    const validated = validateGlbBuffer(ab);
    if (!validated.ok) {
      return fail(validated.error, validated.reason === 'too-large' ? 413 : 400);
    }
  }

  // Basic USDZ integrity check: must be a non-trivial ZIP archive (genuine USDZ package).
  if (mimeType === 'model/vnd.usdz+zip') {
    if (buffer.length < 64) {
      return fail('That USDZ file appears invalid or incomplete. Upload a genuine USDZ export of the same model.', 400);
    }
  }

  let stored;
  try {
    stored = await uploadMenuModel(menuItemId, buffer, mimeType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  // Replace only the uploaded slot; keep the other format so both assets can
  // coexist for cross-platform AR. Clean up the previous file for this slot.
  const previousUrl =
    mimeType === 'model/gltf-binary' ? menuItem.model_url_glb : menuItem.model_url_usdz;

  const updatePayload =
    mimeType === 'model/gltf-binary'
      ? { model_url_glb: stored.publicUrl }
      : { model_url_usdz: stored.publicUrl };

  const { error: updateError } = await supabaseAdmin
    .from('menu_items')
    .update(updatePayload)
    .eq('id', menuItemId);

  if (updateError) {
    // Clean up newly uploaded orphaned file
    await deleteMenuModel(stored.publicUrl);
    return fail(`Could not save the model reference: ${updateError.message}`, 500);
  }

  if (previousUrl && previousUrl !== stored.publicUrl) {
    await deleteMenuModel(previousUrl);
  }

  const { data: updatedItem } = await supabaseAdmin
    .from('menu_items')
    .select('model_url_glb, model_url_usdz')
    .eq('id', menuItemId)
    .single();

  const glbUrl = updatedItem?.model_url_glb ?? (mimeType === 'model/gltf-binary' ? stored.publicUrl : menuItem.model_url_glb);
  const usdzUrl = updatedItem?.model_url_usdz ?? (mimeType === 'model/vnd.usdz+zip' ? stored.publicUrl : menuItem.model_url_usdz);

  return NextResponse.json(
    {
      success: true,
      model: {
        url: stored.publicUrl,
        mimeType: stored.mimeType,
        bytes: stored.bytes,
        isViewable: isViewableIn3D(stored.mimeType),
        slot: mimeType === 'model/gltf-binary' ? 'glb' : 'usdz',
      },
      models: {
        glb_url: glbUrl || null,
        usdz_url: usdzUrl || null,
      },
      arReady: Boolean(glbUrl && usdzUrl),
    },
    { headers: NO_STORE }
  );
}

/**
 * DELETE /api/menu/3d-model?menu_item_id=...&model_type=glb|usdz|all
 *
 * Removes an uploaded model and clears its reference. By default removes the
 * specified type (or both when model_type=all / omitted for backward compat).
 */
export async function DELETE(request: Request) {
  const access = await requireOwnedHotelId(null);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  const { searchParams } = new URL(request.url);
  const menuItemId = searchParams.get('menu_item_id');
  if (!menuItemId) return fail('menu_item_id is required.', 400);

  const modelType = (searchParams.get('model_type') || 'all').toLowerCase();
  if (!['glb', 'usdz', 'all'].includes(modelType)) {
    return fail('model_type must be glb, usdz, or all.', 400);
  }

  // Verify ownership
  const { data: menuItem, error: itemError } = await supabaseAdmin
    .from('menu_items')
    .select('id, hotel_id, model_url_glb, model_url_usdz')
    .eq('id', menuItemId)
    .single();

  if (itemError || !menuItem) return fail('Dish not found.', 404);
  if (menuItem.hotel_id !== access.hotelId) return fail('You can only remove models from your own dishes.', 403);

  let removedAny = false;
  const updatePayload: Record<string, null> = {};

  if (modelType === 'glb' || modelType === 'all') {
    if (menuItem.model_url_glb && (await deleteMenuModel(menuItem.model_url_glb))) removedAny = true;
    updatePayload.model_url_glb = null;
  }
  if (modelType === 'usdz' || modelType === 'all') {
    if (menuItem.model_url_usdz && (await deleteMenuModel(menuItem.model_url_usdz))) removedAny = true;
    updatePayload.model_url_usdz = null;
  }

  const { error: updateError } = await supabaseAdmin
    .from('menu_items')
    .update(updatePayload)
    .eq('id', menuItemId);

  if (updateError) return fail(`Could not clear model reference: ${updateError.message}`, 500);

  const glbUrl = modelType === 'glb' || modelType === 'all' ? null : menuItem.model_url_glb;
  const usdzUrl = modelType === 'usdz' || modelType === 'all' ? null : menuItem.model_url_usdz;

  return NextResponse.json(
    {
      success: true,
      removedFile: removedAny,
      message: removedAny ? 'Model removed.' : 'No uploaded model to remove.',
      models: { glb_url: glbUrl, usdz_url: usdzUrl },
      arReady: Boolean(glbUrl && usdzUrl),
    },
    { headers: NO_STORE }
  );
}