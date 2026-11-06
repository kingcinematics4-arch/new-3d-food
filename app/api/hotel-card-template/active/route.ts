// app/api/hotel-card-template/active/route.ts
// Public read: active hotel identity card template design (image + field layout).
// No secrets; image is in public storage. Used by dashboard Hotels page.
import { NextResponse } from 'next/server';
import { getActiveTemplate } from '@/lib/hotelCardTemplate.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const template = await getActiveTemplate();
    return NextResponse.json({ success: true, template }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ success: true, template: null, error: e?.message }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
