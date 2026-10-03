// app/api/admin/auth/session/route.ts
//
// Reports whether the current browser holds a live admin session.
// Returns no secret material of any kind.

import { NextResponse } from 'next/server';
import { isAdminConfigured } from '@/lib/adminAuth';
import { getAdminSession } from '@/lib/adminSession.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getAdminSession();

  return NextResponse.json(
    {
      authenticated: session !== null,
      configured: isAdminConfigured(),
      expiresAt: session ? new Date(session.expiresAt).toISOString() : null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}