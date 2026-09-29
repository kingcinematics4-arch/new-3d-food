// app/api/hotel/me/route.ts
// Resolve the hotel owned by the *authenticated* user.
//
// The identity is always `auth.uid()` -> `public.hotels.user_id`.
// This runs on the server with the request's auth cookies, so RLS-scoped
// Supabase client is used. The browser client must never query hotels
// directly (RLS would block it), which is why every dashboard data fetch
// flows through server API routes like this one.
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getHotelForUser } from '@/lib/serverAuth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hotel = await getHotelForUser(user.id);
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'No hotel found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, hotel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve hotel' },
      { status: 500 }
    );
  }
}