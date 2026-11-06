// app/api/admin/branding/hotel-cards/preview-hotels/route.ts
// Admin-only. Returns a small set of real hotels for the template live preview.
// No secrets/credentials returned.

import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/adminApiGuard';
import { supabaseAdmin, assertSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAdminApi();
  if (guard) return guard;
  try {
    assertSupabaseAdminConfigured();
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('id,name,slug,location,owner_name,email,subscription_plan,is_active,hotel_public_id,created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, hotels: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to load hotels' }, { status: 500 });
  }
}
