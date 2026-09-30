// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { getServerSupabase, clearLegacyAuthCookies } from '@/lib/serverAuth';
import { isEmailRateLimitError, isEmailUnconfirmedError } from '@/lib/authThrottle';
import { isSupabaseConfigured } from '@/lib/supabaseEnv';

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Authentication is not configured on this deployment.' },
        { status: 503 }
      );
    }

    let email: string;
    let password: string;

    try {
      const body = await request.json();
      email = body?.email;
      password = body?.password;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // The session is written by @supabase/ssr itself, into the standard
    // `sb-<project-ref>-auth-token` cookie. That is the exact store the browser
    // client, the middleware and every API route read, so signing in here is
    // what makes the dashboard AND /api/* see the same Supabase user.
    const { data, error } = await getServerSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message || 'Invalid credentials';

      if (isEmailRateLimitError(message)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many attempts. Please wait a minute and try again.',
          },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      if (isEmailUnconfirmedError(message)) {
        return NextResponse.json(
          {
            success: false,
            emailUnconfirmed: true,
            error: 'Email not confirmed yet. Check your inbox, or request a new confirmation link below.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, error: 'Authentication succeeded but no session was created' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
    });

    clearLegacyAuthCookies(response);

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}


