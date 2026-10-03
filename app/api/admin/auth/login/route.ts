// app/api/admin/auth/login/route.ts
//
// Password exchange for the Dine3D owner panel.
//
// The candidate password arrives here, is compared server-side against
// `DINE3D_ADMIN_PASSWORD`, and the response body contains nothing but a boolean
// and the session expiry. The password itself is never echoed, never logged and
// never present in the client bundle, because it lives only in a server-side
// environment variable that is not `NEXT_PUBLIC_`-prefixed.
//
// This is entirely separate from the Supabase auth routes under /api/auth.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/adminAuth';
import { canAttempt, recordFailure, recordSuccess } from '@/lib/adminThrottle';

// Never cached and never statically optimised: this must always hit the server.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required').max(512),
});

/**
 * Best-effort client identity for throttling.
 * `x-forwarded-for` is set by the hosting platform; it is only ever used as a
 * rate-limit bucket key, never as an authorisation decision.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: Request) {
  // Distinct responses for "not configured" vs "wrong password", so the owner
  // can act on the first one.
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'Admin access is not configured. Set DINE3D_ADMIN_PASSWORD in the server environment.',
      },
      { status: 503 }
    );
  }

  const key = clientKey(request);

  const throttle = canAttempt(key);
  if (!throttle.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many attempts. Please wait before trying again.',
        retryAfterSeconds: throttle.retryAfterSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } }
    );
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = loginSchema.parse(body);
  } catch {
    // A malformed body is treated as a failed attempt, never as a bypass.
    recordFailure(key);
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const valid = await verifyAdminPassword(parsed.password);

  if (!valid) {
    recordFailure(key);
    // Generic message: never reveal whether the password was close.
    return NextResponse.json({ success: false, error: 'Incorrect password.' }, { status: 401 });
  }

  recordSuccess(key);

  const token = await createAdminSessionToken();

  const response = NextResponse.json({ success: true, expiresInSeconds: ADMIN_COOKIE_MAX_AGE });
  response.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions(ADMIN_COOKIE_MAX_AGE));
  return response;
}