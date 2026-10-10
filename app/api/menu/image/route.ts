import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { uploadMenuImage, deleteMenuImage } from '@/lib/menuImage.server';
import { MAX_MENU_IMAGE_BYTES, MENU_IMAGE_FILE_ACCEPT } from '@/lib/menuImage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function parseFormData(request: NextRequest) {
  return request.formData().then((form) => {
    const fileEntry = form.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    const menuItemIdEntry = form.get('menu_item_id');
    const menuItemId = typeof menuItemIdEntry === 'string' ? menuItemIdEntry : null;
    const actionEntry = form.get('action');
    const action = typeof actionEntry === 'string' ? actionEntry : 'upload';
    return { file, menuItemId, action } as { file: File | null; menuItemId: string | null; action: string };
  });
}

export async function POST(request: NextRequest) {
  const { file, menuItemId, action } = await parseFormData(request);

  if (action === 'delete') {
    const path = typeof menuItemId === 'string' ? menuItemId : null;
    if (!path) {
      return errorResponse('Missing image path', 400);
    }
    try {
      await deleteMenuImage(path);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return errorResponse(err.message, 500);
    }
  }

  if (!file) {
    return errorResponse('No file provided', 400);
  }
  if (!menuItemId) {
    return errorResponse('Missing menu item ID', 400);
  }

  if (file.size === 0) {
    return errorResponse('File is empty', 400);
  }
  if (file.size > MAX_MENU_IMAGE_BYTES) {
    return errorResponse(`File exceeds ${MAX_MENU_IMAGE_BYTES} bytes limit`, 400);
  }

  const acceptTypes = MENU_IMAGE_FILE_ACCEPT.split(',').map((t) => t.trim()).filter(Boolean);
  const declaredType = (file.type || '').toLowerCase();
  if (declaredType && !acceptTypes.includes(declaredType)) {
    return errorResponse('Unsupported file type', 400);
  }

  try {
    const { url, path } = await uploadMenuImage(menuItemId, file);
    return NextResponse.json({ success: true, url, path });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (!path) {
    return errorResponse('Missing image path', 400);
  }
  try {
    await deleteMenuImage(path);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}