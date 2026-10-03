// lib/adminApiGuard.ts
//
// SERVER ONLY. Authorization gate for admin API route handlers.
//
// Every admin route calls this before touching storage. It performs the full
// check (signature, expiry AND post-logout revocation), returning a 401
// `NextResponse` instead of throwing, so a handler can simply bail out.

import { NextResponse } from 'next/server';
import { getAdminSession } from './adminSession.server';

/**
 * Returns null when the caller is an authenticated admin, or a ready-to-return
 * 401 response when they are not.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await getAdminSession();

  if (session) return null;

  return NextResponse.json(
    { success: false, error: 'Not authenticated.' },
    { status: 401, headers: { 'Cache-Control': 'no-store' } }
  );
}