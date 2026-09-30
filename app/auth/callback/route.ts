// app/auth/callback/route.ts
// Handles the Supabase email confirmation redirect.
//
// Supabase confirms the email first, then sends the user here. This route
// exchanges the confirmation token for a real session, stores it in the
// session cookies, and redirects to /dashboard.
//
// The URL that Supabase redirects to is the `emailRedirectTo` value sent during
// signUp()/resend() (see lib/siteUrl.ts). If that value is not present in the
// Supabase redirect allow-list, Supabase ignores it and falls back to the
// project Site URL - which is how confirmation links end up on localhost.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabasePublishableKey, isSupabaseConfigured } from '@/lib/supabaseEnv';
import { clearLegacyAuthCookies } from '@/lib/serverAuth';
import { getPublicSiteUrl } from '@/lib/siteUrl';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');

  // Only allow same-origin relative paths as a post-login destination.
  const rawNext = requestUrl.searchParams.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/dashboard';

  const siteUrl = getPublicSiteUrl(request);
  const destinationUrl = new URL(next, siteUrl);

  const redirectTo = (path: string, params: Record<string, string> = {}) => {
    const target = new URL(path, siteUrl);
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target);
  };

  // Supabase reported a problem (expired link, already used, ...).
  const errorDescription =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error');
  if (errorDescription) {
    return redirectTo('/login', { error: errorDescription });
  }

  if (!isSupabaseConfigured()) {
    return redirectTo('/login', {
      error: 'Authentication is not configured on this deployment.',
    });
  }

  let response = NextResponse.redirect(destinationUrl);

  // @supabase/ssr writes the confirmed session into the standard
  // `sb-<project-ref>-auth-token` cookie, which is the same store the dashboard
  // and every API route read. Nothing about the session is hand-rolled here.
  const applyCookiesToResponse = (cookiesToSet: { name: string; value: string; options?: any }[]) => {
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options ?? {});
    }
  };

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        applyCookiesToResponse(cookiesToSet);
      },
    },
  });

  const redirectWithSession = () => {
    const next = NextResponse.redirect(destinationUrl);
    response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
    clearLegacyAuthCookies(next);
    return next;
  };

  try {
    // 1. Token hash / OTP flow - the link Supabase sends for confirmation emails.
    if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: (type || 'signup') as any,
      });

      if (error) {
        console.error('Email confirmation verification failed:', error.message);
        return redirectTo('/login', {
          error:
            'This confirmation link is invalid or has already been used. Request a new confirmation email from the sign-in screen.',
        });
      }

      if (data?.session) {
        return redirectWithSession();
      }
    }

    // 2. PKCE code exchange flow.
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Confirmation code exchange failed:', error.message);
        return redirectTo('/login', {
          error:
            'This confirmation link could not be verified. Request a new confirmation email from the sign-in screen.',
        });
      }

      if (data?.session) {
        return redirectWithSession();
      }
    }
  } catch (err) {
    console.error('Auth callback exception:', err);
  }

  // No usable token: the email link was stripped of its parameters.
  return redirectTo('/login', {
    error: 'This confirmation link is incomplete. Please request a new confirmation email.',
  });
}
