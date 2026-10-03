// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured,
} from '@/lib/supabaseEnv';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/adminAuth';

/**
 * Guards two completely separate areas:
 *
 *   /dashboard/*  Supabase Auth, for restaurant owners.
 *   /admin/*      Dine3D owner panel, signed cookie session.
 *
 * The two auth systems share nothing. A restaurant session can never open
 * /admin, and an admin session can never open /dashboard.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    return protectAdmin(request);
  }

  return protectDashboard(request);
}

/**
 * Dine3D owner panel.
 *
 * This is a fast stateless check (signature + expiry) so it can run on the Edge
 * runtime. It deliberately does not consult the database: the revocation marker
 * is checked by `adminSession.server.ts`, which runs in the layout and in every
 * admin API route. A logout therefore blocks the panel even though the cookie's
 * signature remains well-formed.
 */
async function protectAdmin(request: NextRequest) {
  // The login screen itself must stay reachable while signed out.
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const session = await verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    // Preserve where they were heading, but only for our own panel paths.
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Protects /dashboard with the real Supabase Auth session.
 *
 * The session is read from - and written back to - the same cookie jar that
 * @supabase/ssr uses everywhere else in this app (`sb-<project-ref>-auth-token`,
 * chunked). `auth.getUser()` revalidates the access token with Supabase and
 * transparently refreshes it through `setAll`, so a long-lived session never
 * bounces the owner out of the dashboard.
 *
 * Sniffing cookie names is deliberately NOT used here: a cookie whose name
 * looks right is not a session, and treating it as one is exactly what let the
 * dashboard render for a request that no API route could authenticate.
 */
async function protectDashboard(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return redirectToLogin(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        // Keep the incoming request consistent for anything downstream...
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // ...and persist the refreshed session on the way out.
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as any)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request);
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
