import { NextResponse } from 'next/server';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { requireDashboardAdminApi } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';
const PLANS = new Set(['BASIC', 'PRO', 'ULTRA', 'CUSTOM']);
const normPlan = (v: any) => { const p = typeof v === 'string' ? v.trim().toUpperCase() : ''; if (p === 'STARTER' || p === 'BASIC') return 'BASIC'; if (PLANS.has(p)) return p; return null; };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireDashboardAdminApi();
  if (denied) return denied;
  try {
    assertSupabaseAdminConfigured();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const patch: any = {};
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;
    if (body.subscriptionPlan !== undefined || body.subscription_plan !== undefined) {
      const plan = normPlan(body.subscriptionPlan ?? body.subscription_plan);
      if (!plan) return NextResponse.json({ success: false, error: 'Invalid plan. Use BASIC, PRO, ULTRA, or CUSTOM.' }, { status: 400 });
      patch.subscription_plan = plan;
    }
    if (Object.keys(patch).length === 0) return NextResponse.json({ success: false, error: 'No supported fields.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('hotels').update(patch).eq('id', id).select('id, name, slug, logo_url, city, owner_name, email, phone, is_active, created_at, hotel_public_id, subscription_plan').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: 'Hotel not found.' }, { status: 404 });
    return NextResponse.json({ success: true, hotel: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Update failed' }, { status: 500 });
  }
}