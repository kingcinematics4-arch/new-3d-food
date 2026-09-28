// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/siteUrl';

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
      const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed');

      if (isUnconfirmed) {
        // Trigger a fresh confirmation email targeting the deployed production URL
        const emailRedirectTo = getAuthCallbackUrl(request, '/dashboard');
        try {
          await supabaseClient.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo,
            },
          });
        } catch {
          // Ignore resend error, still inform the user
        }

        return NextResponse.json(
          {
            success: false,
            emailUnconfirmed: true,
            error: 'Email not confirmed. A new confirmation link has been sent to your email address.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
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


