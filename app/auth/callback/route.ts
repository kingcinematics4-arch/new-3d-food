// app/auth/callback/route.ts
// Handles Supabase email confirmation & authentication callback redirects.
// Exchanges the PKCE code or token hash for a verified user session,
// sets the authentication cookies, and redirects the confirmed user to the dashboard.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabasePublishableKey, isSupabaseConfigured } from '@/lib/supabaseEnv';
import { getSiteUrl } from '@/lib/siteUrl';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const errorDescription = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');

  const siteUrl = getSiteUrl(request);
  const targetPath = next.startsWith('/') ? next : '/dashboard';
  const destinationUrl = new URL(targetPath, siteUrl);

  // If Supabase returned an error query parameter in the redirect
  if (errorDescription) {
    const loginErrorUrl = new URL('/login', siteUrl);
    loginErrorUrl.searchParams.set('error', errorDescription);
    return NextResponse.redirect(loginErrorUrl);
  }

  const response = NextResponse.redirect(destinationUrl);

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    // 1. PKCE Code Exchange Flow (default in modern Supabase SSR)
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session) {
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: data.session.expires_in || 3600 * 24 * 7,
        });
        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600 * 24 * 30,
          });
        }
        return response;
      }
    }

    // 2. Token Hash / OTP Verification Flow (used by email confirmation links with token_hash)
    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (!error && data?.session) {
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: data.session.expires_in || 3600 * 24 * 7,
        });
        if (data.session.refresh_token) {
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 3600 * 24 * 30,
          });
        }
        return response;
      }
    }
  } catch (err) {
    console.error('Auth callback exception:', err);
  }

  // Redirect confirmed user to destination (or /dashboard)
  return response;
}
