import { NextResponse } from 'next/server';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { requireDashboardAdminApi } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireDashboardAdminApi();
  if (denied) return denied;
  try {
    assertSupabaseAdminConfigured();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch: any = {};
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
    if (Object.keys(patch).length === 0) return NextResponse.json({ success: false, error: 'No supported fields.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('hotels').update(patch).eq('id', id).select('id, name, slug, logo_url, city, owner_name, email, phone, is_active, created_at, hotel_public_id').maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, hotel: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Update failed' }, { status: 500 });
  }
}