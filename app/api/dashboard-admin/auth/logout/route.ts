import { NextResponse } from 'next/server';
import { DASHBOARD_ADMIN_COOKIE, dashboardAdminCookieOptions } from '@/lib/dashboardAdminAuth';
import { revokeDashboardAdminSessions } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  await revokeDashboardAdminSessions();
  const res = NextResponse.json({ success: true });
  res.cookies.set(DASHBOARD_ADMIN_COOKIE, '', dashboardAdminCookieOptions(0));
  return res;
}
