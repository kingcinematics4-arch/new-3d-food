// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { isEmailRateLimitError, isEmailUnconfirmedError } from '@/lib/authThrottle';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message = error.message || 'Invalid credentials';

      // Rate limiting is reported as-is; this route never sends email so it
      // cannot contribute to the confirmation-email quota.
      if (isEmailRateLimitError(message)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many attempts. Please wait a minute and try again.',
          },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      // An unconfirmed account is reported to the client, but NO confirmation
      // email is sent from here. Sending it silently on every failed login is
      // what exhausted the Supabase email rate limit. The user must explicitly
      // request a resend from the login screen.
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

    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });

    if (data.session) {
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
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}


