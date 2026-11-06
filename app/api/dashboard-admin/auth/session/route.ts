import { NextResponse } from 'next/server';
import { getDashboardAdminSession } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const s = await getDashboardAdminSession();
  return NextResponse.json({ authenticated: !!s }, { headers: { 'Cache-Control': 'no-store' } });
}
