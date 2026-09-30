// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signUpAndOnboardHotel, signUpSchema } from '@/lib/auth';
import { getServerSupabase, clearLegacyAuthCookies } from '@/lib/serverAuth';
import { getAuthCallbackUrl } from '@/lib/siteUrl';
import { isEmailRateLimitError, isEmailUnconfirmedError } from '@/lib/authThrottle';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const callbackUrl = getAuthCallbackUrl(request);
    const result = await signUpAndOnboardHotel(validatedData, callbackUrl);

    let session: {
      access_token: string;
      refresh_token: string;
      expires_at?: number;
      expires_in?: number;
      token_type?: string;
    } | null = null;

    // Attempt to establish the session so the redirect to /dashboard works
    // seamlessly. This is a credential sign-in only - it sends no email - and it
    // is skipped entirely when Supabase still requires email confirmation. The
    // session lands in the standard Supabase session cookie, exactly as it does
    // on /api/auth/login, so the API layer can resolve the new owner.
    if (!result.requiresEmailConfirmation) {
      try {
        const { data: loginData, error: loginError } = await getServerSupabase().auth.signInWithPassword({
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
          session = {
            access_token: loginData.session.access_token,
            refresh_token: loginData.session.refresh_token,
            expires_at: loginData.session.expires_at,
            expires_in: loginData.session.expires_in,
            token_type: loginData.session.token_type,
          };
        }
      } catch {
        // Auto sign-in is best-effort; user can still sign in manually if needed
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Hotel created successfully!',
        hotel: result.hotel,
        userId: result.userId,
        // When true the client must show a "check your email" state and must not
        // redirect to the dashboard. It never triggers another email on its own.
        requiresEmailConfirmation: result.requiresEmailConfirmation,
        session,
      },
      { status: 201 }
    );

    clearLegacyAuthCookies(response);

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
