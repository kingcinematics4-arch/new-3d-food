import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import { DASHBOARD_ADMIN_COOKIE, dashboardAdminCookieOptions, DASHBOARD_ADMIN_MAX_AGE, verifyDashboardAdminToken, createDashboardAdminToken } from './dashboardAdminAuth';

const STATE_ID = true;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map<string, { n: number; at: number; until: number }>();

export function canAttemptDashboardAdmin(key: string) {
  const b = buckets.get(key) || { n: 0, at: 0, until: 0 };
  const now = Date.now();
  if (b.until > now) return { allowed: false, retryAfterSeconds: Math.ceil((b.until - now) / 1000) };
  if (b.n > 0 && now - b.at > WINDOW_MS) { b.n = 0; b.at = 0; }
  if (b.n >= MAX_ATTEMPTS) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - b.at)) / 1000)) };
  buckets.set(key, b); return { allowed: true, retryAfterSeconds: 0 };
}
export function recordDashboardAdminFailure(key: string) {
  const b = buckets.get(key) || { n: 0, at: 0, until: 0 };
  const now = Date.now();
  if (!b.n || now - b.at > WINDOW_MS) { b.n = 0; b.at = now; }
  b.n += 1; if (b.n >= 5) b.until = now + 5 * 60 * 1000; buckets.set(key, b);
}
export function recordDashboardAdminSuccess(key: string) { buckets.delete(key); }

async function getRevokedAt(): Promise<string | null> {
  try {
    assertSupabaseAdminConfigured();
    const { data } = await supabaseAdmin.from('dashboard_admin_session_state').select('revoked_at').eq('id', STATE_ID).maybeSingle();
    return (data as any)?.revoked_at ?? null;
  } catch { return null; }
}

export async function getDashboardAdminSession() {
  const token = cookies().get(DASHBOARD_ADMIN_COOKIE)?.value;
  const session = await verifyDashboardAdminToken(token);
  if (!session) return null;
  const revokedAt = await getRevokedAt();
  if (revokedAt && session.iat <= new Date(revokedAt).getTime()) return null;
  return session;
}

export async function requireDashboardAdminApi(): Promise<NextResponse | null> {
  const s = await getDashboardAdminSession();
  if (s) return null;
  return NextResponse.json({ success: false, error: 'Dashboard admin access required.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
}

export async function issueDashboardAdminCookie() {
  const token = await createDashboardAdminToken();
  const res = NextResponse.json({ success: true, expiresInSeconds: DASHBOARD_ADMIN_MAX_AGE });
  res.cookies.set(DASHBOARD_ADMIN_COOKIE, token, dashboardAdminCookieOptions(DASHBOARD_ADMIN_MAX_AGE));
  return res;
}

export async function revokeDashboardAdminSessions() {
  try {
    assertSupabaseAdminConfigured();
    await supabaseAdmin.from('dashboard_admin_session_state').upsert({ id: STATE_ID, revoked_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch {}
}
