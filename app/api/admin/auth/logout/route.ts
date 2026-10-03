// app/api/admin/auth/logout/route.ts
//
// Ends the Dine3D admin session.
//
// Logout is server-side, not just a cookie delete: the revocation marker is
// written first, which permanently invalidates every session token issued at
// or before this moment — including a copy that was captured before logout.
// The browser cookie is then cleared.

import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, adminCookieOptions } from '@/lib/adminAuth';
import { revokeAllAdminSessions } from '@/lib/adminSession.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  // Revoke first. If this fails the cookie is still cleared below, so the
  // browser always ends up signed out.
  try {
    await revokeAllAdminSessions();
  } catch {
    // Continue: clearing the cookie is the part the user depends on.
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(ADMIN_COOKIE_NAME, '', adminCookieOptions(0));

  return response;
}