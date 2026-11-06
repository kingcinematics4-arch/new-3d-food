import { NextResponse } from 'next/server';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { getHotelSchema } from '@/lib/hotelSchema';
import { assignHotelPublicIdIfMissing, isValidHotelPublicId } from '@/lib/hotelPublicId';
import { getAuthenticatedUser } from '@/lib/serverAuth';
import { findHotelOwnedByUser } from '@/lib/hotelAccess';
import { getDashboardAdminSession } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';

function pickHotel(row: any) {
  if (!row) return null;
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
  try {
    assertSupabaseAdminConfigured();
    // Hotels section: no Admin lock. Use normal dashboard permissions.
    const admin = await getDashboardAdminSession();
    const user = admin ? null : await getAuthenticatedUser();
    if (!admin && !user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const schema = await getHotelSchema();
    const idCol = (schema as any).hotelPublicId ? ', hotel_public_id' : '';
    const base = `id, name, slug, logo_url, city, owner_name, email, phone, is_active, created_at${idCol}`;

    let rows: any[] = [];
    const canManage = !!admin;
    if (admin) {
      const { data, error } = await supabaseAdmin.from('hotels').select(base).order('created_at', { ascending: false });
      if (error) throw error;
      rows = (data || []) as any[];
    } else {
      const owned = await findHotelOwnedByUser(user!.id);
      if (!owned) return NextResponse.json({ success: true, hotels: [], canManage: false }, { headers: { 'Cache-Control': 'no-store' } });
      const { data, error } = await supabaseAdmin.from('hotels').select(base).eq('id', owned.id).limit(1);
      if (error) throw error;
      rows = (data || []) as any[];
    }

    // Safe, idempotent: assign permanent AA12bb123 IDs only where missing/invalid. Preserves existing valid IDs.
    if ((schema as any).hotelPublicId) {
      for (const r of rows) {
        if (isValidHotelPublicId(r.hotel_public_id)) continue;
        try { const id = await assignHotelPublicIdIfMissing(r.id, r.hotel_public_id); if (id) r.hotel_public_id = id; } catch {}
      }
    }

    return NextResponse.json({ success: true, hotels: rows.map(pickHotel), canManage, schema: { hotelPublicId: !!(schema as any).hotelPublicId } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to load hotels' }, { status: 500 });
  }
}
