// app/api/dashboard-admin/hotels/[id]/logo/route.ts
//
// Per-hotel logo upload and removal for the DinePixel Luxury Hotel Card.
//
// Authorization: dashboard admin session can manage any hotel; a signed-in
// hotel owner can manage only their own hotel. The service-role key never
// reaches the browser - this route is the gatekeeper for Supabase Storage.
//
// Storage: files live in the existing public `dine3d-branding` bucket under
// `hotel-logo/{hotelId}/...` paths. The bucket has public read and no public
// write, so uploads can only happen server-side here.
//
// The logo URL is persisted on the hotel row in `public.hotels.logo_url`,
// which already exists from migration 001.

import { NextResponse } from 'next/server';
import { requireDashboardAdminApi } from '@/lib/dashboardAdminSession.server';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { findHotelOwnedByUser } from '@/lib/hotelAccess';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import {
  uploadHotelLogo,
  deleteHotelLogo,
  sniffImageMime,
  MAX_LOGO_BYTES,
  LOGO_MIME_TYPES,
  formatBytes,
} from '@/lib/branding.server';

const NO_STORE = { 'Cache-Control': 'no-store' };

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: NO_STORE });
}

/**
 * Resolve the hotel the caller is allowed to manage.
 *
 * Returns the hotel row when authorised, or a NextResponse error when not.
 */
async function resolveManagedHotel(hotelId: string): Promise<{ id: string } | NextResponse> {
  const admin = await requireDashboardAdminApi();
  if (!admin) {
    // Dashboard admin session is valid: can manage any hotel.
    return { id: hotelId };
  }

  // No admin session: fall back to the signed-in user's owned hotel.
  const user = await getAuthenticatedUser();
  if (!user) {
    return fail('Not authenticated', 401);
  }

  const owned = await findHotelOwnedByUser(user.id);
  if (!owned) {
    return fail('No restaurant is linked to this account.', 403);
  }
  if (owned.id !== hotelId) {
    return fail('You do not have access to this hotel.', 403);
  }

  return { id: hotelId };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/dashboard-admin/hotels/[id]/logo
 *
 * Multipart body with a single `file` field. Validates the real image type
 * from magic bytes, enforces the size cap, uploads to the branding bucket,
 * and writes the public URL to `hotels.logo_url`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params;
  const managed = await resolveManagedHotel(hotelId);
  if (managed instanceof NextResponse) return managed;

  assertSupabaseAdminConfigured();

  let file: File | null = null;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return fail('Send the logo as multipart/form-data with a "file" field.', 415);
    }

    const form = await request.formData();
    const candidate = form.get('file');
    if (!candidate || typeof candidate === 'string') {
      return fail('No file was received. Choose a logo image and try again.', 400);
    }
    file = candidate;
  } catch {
    return fail('Could not read the upload. Try again with a smaller file.', 400);
  }

  if (!file || file.size === 0) {
    return fail('That file is empty.', 400);
  }

  if (file.size > MAX_LOGO_BYTES) {
    return fail(
      `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_LOGO_BYTES)}.`,
      413
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return fail('Could not read the uploaded file.', 400);
  }

  if (buffer.length > MAX_LOGO_BYTES) {
    return fail(
      `That image is ${formatBytes(buffer.length)}. The maximum is ${formatBytes(MAX_LOGO_BYTES)}.`,
      413
    );
  }

  const mimeType = sniffImageMime(buffer);
  if (!mimeType) {
    return fail(`That file is not an image. Upload an ${'PNG, JPG, WebP or SVG'} file.`, 415);
  }

  const declared = (file.type || '').toLowerCase();
  if (
    declared &&
    declared !== 'application/octet-stream' &&
    !LOGO_MIME_TYPES.includes(declared as (typeof LOGO_MIME_TYPES)[number])
  ) {
    return fail(`That file type (${declared}) is not supported.`, 415);
  }

  let stored;
  try {
    stored = await uploadHotelLogo(hotelId, buffer, mimeType);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return fail(message, 500);
  }

  try {
    const { error } = await updateHotelLogo(hotelId, stored.publicUrl);
    if (error) {
      // Orphan cleanup: the file uploaded but the DB reference did not update.
      await deleteHotelLogo(stored.publicUrl);
      return fail(error.message, 500);
    }
  } catch (error: any) {
    await deleteHotelLogo(stored.publicUrl);
    return fail(error.message || 'Could not save the logo.', 500);
  }

  return NextResponse.json(
    {
      success: true,
      logoUrl: stored.publicUrl,
      file: { bytes: stored.bytes, mimeType: stored.mimeType, version: stored.version },
    },
    { headers: NO_STORE }
  );
}

/**
 * DELETE /api/dashboard-admin/hotels/[id]/logo
 *
 * Removes the stored logo file and clears `hotels.logo_url`.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params;
  const managed = await resolveManagedHotel(hotelId);
  if (managed instanceof NextResponse) return managed;

  assertSupabaseAdminConfigured();

  // Read the current logo URL before clearing it.
  const { data: current, error: readError } = await supabaseAdmin
    .from('hotels')
    .select('id, logo_url')
    .eq('id', hotelId)
    .maybeSingle();
  if (readError || !current) {
    return fail('Hotel not found.', 404);
  }

  const currentLogoUrl = (current as any).logo_url ?? null;

  // Clear the DB reference first.
  const { error: clearError } = await supabaseAdmin
    .from('hotels')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', hotelId)
    .select('id, logo_url')
    .maybeSingle();
  if (clearError) {
    return fail(clearError.message, 500);
  }

  // Then delete the stored file (best effort - an orphan is not user-facing).
  if (currentLogoUrl) {
    await deleteHotelLogo(currentLogoUrl);
  }

  return NextResponse.json(
    { success: true, logoUrl: null, message: 'Logo removed.' },
    { headers: NO_STORE }
  );
}

async function updateHotelLogo(hotelId: string, logoUrl: string | null) {
  return supabaseAdmin
    .from('hotels')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', hotelId)
    .select('id, logo_url')
    .maybeSingle();
}
