// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured,
} from '@/lib/supabaseEnv';

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
export async function middleware(request: NextRequest) {
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
  matcher: ['/dashboard/:path*'],
};
