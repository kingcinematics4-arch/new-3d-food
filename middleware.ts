// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Supabase stores the auth session in cookies named:
 *   sb-<project-ref>-access-token   (the access token JWT)
 * plus a few supporting tokens (refresh-token, user, etc.).
 *
 * We check for the access-token cookie as the canonical signal that a real
 * Supabase Auth session exists. If it is missing we redirect to /login.
 */
function hasSupabaseSession(request: NextRequest): boolean {
  const cookieNames = [
    'sb-access-token',
    'supabase-auth-token',
    'sb-localhost-auth-token',
  ];

  for (const name of cookieNames) {
    if (request.cookies.has(name)) return true;
  }

  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (/^sb-[a-z0-9_-]+-(access-token|auth-token)/i.test(cookie.name)) return true;
    if (/^sb-[a-z0-9_-]+-token/i.test(cookie.name)) return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  if (!hasSupabaseSession(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};