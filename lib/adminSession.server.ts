// lib/adminSession.server.ts
//
// SERVER ONLY. Full admin session check, including server-side logout
// revocation.
//
// Split from `adminAuth.ts` because reading the revocation marker needs the
// Supabase service-role key, and that must stay out of the Edge middleware
// bundle. The layering is deliberate:
//
//   middleware.ts  -> verifyAdminSessionToken   (signature + expiry only)
//   layout/routes  -> isAdminAuthenticated     (adds logout revocation)
//
// A revoked session is therefore blocked by the route and the layout even
// though the stateless signature is still well-formed.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin, assertSupabaseAdminConfigured } from './supabaseAdmin';
import {
  ADMIN_COOKIE_NAME,
  isAdminSessionActive,
  verifyAdminSessionToken,
  type AdminSession,
} from './adminAuth';

const SESSION_STATE_ID = true;

/**
 * Reads the raw session token from the incoming request.
 * Lives here rather than in `adminAuth.ts` so that module stays free of
 * `next/headers` and remains importable from Edge middleware.
 */
function readAdminTokenFromCookies(): string | undefined {
  return cookies().get(ADMIN_COOKIE_NAME)?.value;
}

/** Timestamp of the most recent logout, or null if the admin has never logged out. */
export async function getAdminRevokedAt(): Promise<string | null> {
  try {
    assertSupabaseAdminConfigured();

    const { data, error } = await supabaseAdmin
      .from('admin_session_state')
      .select('revoked_at')
      .eq('id', SESSION_STATE_ID)
      .maybeSingle();

    if (error) throw error;
    return (data as any)?.revoked_at ?? null;
  } catch {
    // Without the revocation store the session is still signature-checked and
    // expiry-bounded; it just cannot be revoked before it expires.
    return null;
  }
}

/**
 * Marks every admin session issued at or before now as invalid.
 * Called by the logout route.
 */
export async function revokeAllAdminSessions(): Promise<void> {
  assertSupabaseAdminConfigured();

  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('admin_session_state')
    .upsert({ id: SESSION_STATE_ID, revoked_at: now }, { onConflict: 'id' });

  if (error) throw error;
}

/**
 * The caller's admin session, or null when they are not signed in.
 * Signature, expiry and logout revocation are all enforced here.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await verifyAdminSessionToken(readAdminTokenFromCookies());
  if (!session) return null;

  const revokedAt = await getAdminRevokedAt();
  if (!isAdminSessionActive(session, revokedAt)) return null;

  return session;
}

/** True when the current request carries a live admin session. */
export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/**
 * Guards a server component under /admin. Redirects to the login screen when
 * there is no valid session, so an unauthenticated request never renders a
 * protected page.
 */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}