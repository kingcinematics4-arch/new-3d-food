import { NextResponse } from 'next/server';
import { isDashboardAdminConfigured, verifyDashboardAdminPassword } from '@/lib/dashboardAdminAuth';
import { canAttemptDashboardAdmin, recordDashboardAdminFailure, recordDashboardAdminSuccess, issueDashboardAdminCookie } from '@/lib/dashboardAdminSession.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clientKey(request: Request): string {
  const f = request.headers.get('x-forwarded-for');
  if (f) return f.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  if (!isDashboardAdminConfigured()) return NextResponse.json({ success: false, error: 'Not configured.' }, { status: 503 });
  const key = clientKey(request);
  const t = canAttemptDashboardAdmin(key);
  if (!t.allowed) return NextResponse.json({ success: false, error: 'Too many attempts. Please wait.', retryAfterSeconds: t.retryAfterSeconds }, { status: 429, headers: { 'Retry-After': String(t.retryAfterSeconds) } });
  let body: any = {};
  try { body = await request.json(); } catch { recordDashboardAdminFailure(key); return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 }); }
  const ok = await verifyDashboardAdminPassword(body?.password || '');
  if (!ok) { recordDashboardAdminFailure(key); return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 }); }
  recordDashboardAdminSuccess(key);
  return issueDashboardAdminCookie();
}
