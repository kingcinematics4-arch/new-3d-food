// app/api/auth/resend-confirmation/route.ts
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/siteUrl';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const emailRedirectTo = getAuthCallbackUrl(request, '/dashboard');

    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation email resent successfully. Please check your inbox.',
      redirectUrl: emailRedirectTo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to resend confirmation email.' },
      { status: 500 }
    );
  }
}
