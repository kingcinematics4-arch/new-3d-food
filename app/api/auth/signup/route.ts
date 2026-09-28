// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { signUpAndOnboardHotel, signUpSchema } from '@/lib/auth';
import { supabaseClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const result = await signUpAndOnboardHotel(validatedData);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Hotel created successfully!',
        hotel: result.hotel,
        userId: result.userId,
      },
      { status: 201 }
    );

    // Attempt to establish session cookies so redirect to /dashboard works seamlessly
    try {
      const { data: loginData } = await supabaseClient.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

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

    return response;
  } catch (error: any) {
    console.error('Onboarding Signup API Error:', error);
    const errorMessage =
      error?.message ||
      (typeof error === 'string' ? error : 'An unexpected error occurred during hotel onboarding');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}

