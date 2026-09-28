// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signUpAndOnboardHotel, signUpSchema } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/siteUrl';
import { isEmailRateLimitError, isEmailUnconfirmedError } from '@/lib/authThrottle';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const callbackUrl = getAuthCallbackUrl(request, '/dashboard');
    const result = await signUpAndOnboardHotel(validatedData, callbackUrl);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Hotel created successfully!',
        hotel: result.hotel,
        userId: result.userId,
        // When true the client must show a "check your email" state and must not
        // redirect to the dashboard. It never triggers another email on its own.
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      },
      { status: 201 }
    );

    // Attempt to establish session cookies so redirect to /dashboard works seamlessly.
    // This is a credential sign-in only - it sends no email. Skipped entirely when
    // Supabase still requires email confirmation.
    if (!result.requiresEmailConfirmation) {
      try {
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

        if (loginError && isEmailUnconfirmedError(loginError.message)) {
          // The account exists but is unconfirmed: tell the client instead of
          // silently failing. No email is resent from here.
          return NextResponse.json(
            {
              success: true,
              message: 'Account created. Please confirm your email address to continue.',
              requiresEmailConfirmation: true,
            },
            { status: 201 }
          );
        }

        if (loginData?.session) {
          response.cookies.set('sb-access-token', loginData.session.access_token, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: loginData.session.expires_in || 3600 * 24 * 7,
          });
          if (loginData.session.refresh_token) {
            response.cookies.set('sb-refresh-token', loginData.session.refresh_token, {
              path: '/',
              httpOnly: true,
              sameSite: 'lax',
              maxAge: 3600 * 24 * 30,
            });
          }
        }
      } catch {
        // Auto sign-in is best-effort; user can still sign in manually if needed
      }
    }

    return response;
  } catch (error: any) {
    const errorMessage =
      error?.message ||
      (typeof error === 'string' ? error : 'An unexpected error occurred during hotel onboarding');

    if (isEmailRateLimitError(errorMessage)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Too many confirmation emails were requested for this address. Please wait a few minutes before trying again.',
          retryAfterSeconds: 300,
        },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}
