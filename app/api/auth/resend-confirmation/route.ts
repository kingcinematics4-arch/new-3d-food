// app/api/auth/resend-confirmation/route.ts
//
// Explicit, user-initiated confirmation-email resend.
//
// Guarantees:
//   * This endpoint is the ONLY place in the app that resends a confirmation
//     email, and it only runs when the user clicks the resend button.
//   * It is never called automatically (not on page load, not on a failed login,
//     not from a retry loop).
//   * Concurrent/repeated clicks are collapsed by a burst guard, so one click
//     produces at most one Supabase email request.
//   * Email verification is never bypassed: the same Supabase confirmation flow
//     is used, just at most once per allowed interval.
import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/siteUrl';
import {
  commitEmailSend,
  isEmailRateLimitError,
  isNoSuchUserError,
  releaseEmailSend,
  reserveEmailSend,
} from '@/lib/authThrottle';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Neutral response: never reveal whether an address is registered.
const NEUTRAL_MESSAGE =
  'If an unconfirmed account exists for that address, a confirmation link is on its way. Please check your inbox and spam folder.';

export async function POST(request: Request) {
  let reservationKey: string | null = null;

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid email address.' },
        { status: 400 }
      );
    }

    // Burst guard: one in-flight send and one send per cooldown window.
    reservationKey = `resend:${email}`;
    const reservation = reserveEmailSend(reservationKey);

    if (!reservation.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            reservation.reason === 'in_flight'
              ? 'A confirmation email is already being sent. Please wait a moment.'
              : 'A confirmation email was sent recently. Please wait before requesting another one.',
          retryAfterSeconds: reservation.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(reservation.retryAfterSeconds) },
        }
      );
    }

    const emailRedirectTo = getAuthCallbackUrl(request);

    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      const message = error.message || '';

      if (isEmailRateLimitError(message)) {
        releaseEmailSend(reservationKey);
        reservationKey = null;
        return NextResponse.json(
          {
            success: false,
            error: 'Supabase has paused confirmation emails for this address because too many were requested. Please try again in a few minutes.',
            retryAfterSeconds: 300,
          },
          { status: 429, headers: { 'Retry-After': '300' } }
        );
      }

      // Unknown / already-confirmed address: release the reservation so the user
      // is not blocked by a cooldown that produced no email.
      releaseEmailSend(reservationKey);
      reservationKey = null;

      if (isNoSuchUserError(message)) {
        return NextResponse.json({
          success: true,
          message: NEUTRAL_MESSAGE,
          redirectUrl: emailRedirectTo,
        });
      }

      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    // A send actually happened - start the cooldown window.
    commitEmailSend(reservationKey);
    reservationKey = null;

    return NextResponse.json({
      success: true,
      message: NEUTRAL_MESSAGE,
      redirectUrl: emailRedirectTo,
    });
  } catch (err: any) {
    if (reservationKey) {
      releaseEmailSend(reservationKey);
    }

    return NextResponse.json(
      { success: false, error: err.message || 'Failed to resend confirmation email.' },
      { status: 500 }
    );
  }
}
