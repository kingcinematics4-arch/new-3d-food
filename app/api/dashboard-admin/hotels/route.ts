import { NextResponse } from 'next/server';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { requireDashboardAdminApi } from '@/lib/dashboardAdminSession.server';
import { getHotelSchema } from '@/lib/hotelSchema';
import { generateUniqueHotelPublicId } from '@/lib/hotelPublicId';

export const dynamic = 'force-dynamic';

function pickHotel(row: any) {
  if (!row) return null;
  // Only management fields needed by the Hotels page. Hotel ID shown only in this gated UI.
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url ?? null,
    city: row.city ?? null,
    owner_name: row.owner_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    is_active: row.is_active !== false,
    created_at: row.created_at ?? null,
    hotel_public_id: row.hotel_public_id ?? null,
  };
}

export async function GET() {
  const denied = await requireDashboardAdminApi();
  if (denied) return denied;
  try {
    assertSupabaseAdminConfigured();
    const schema = await getHotelSchema();
    const idCol = (schema as any).hotelPublicId ? ', hotel_public_id' : '';
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select(`id, name, slug, logo_url, city, owner_name, email, phone, is_active, created_at${idCol}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data || []) as any[];
    // Safe backfill for legacy rows only when column exists and value missing (does not alter other records).
    if ((schema as any).hotelPublicId) {
      for (const r of rows) {
        if (!r.hotel_public_id) {
          try {
            const hid = await generateUniqueHotelPublicId();
            const { data: upd } = await supabaseAdmin.from('hotels').update({ hotel_public_id: hid }).eq('id', r.id).is('hotel_public_id', null).select('hotel_public_id').maybeSingle();
            if (upd?.hotel_public_id) r.hotel_public_id = upd.hotel_public_id;
          } catch {}
        }
      }
    }
    return NextResponse.json({ success: true, hotels: rows.map(pickHotel), schema: { hotelPublicId: !!(schema as any).hotelPublicId } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to load hotels' }, { status: 500 });
  }
}
