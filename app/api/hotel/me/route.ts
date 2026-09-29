// app/api/hotel/me/route.ts
// Resolve the hotel owned by the *authenticated* user.
//
// The identity is always `auth.uid()` -> `public.hotels.user_id` (with the
// `public.hotel_users` owner link as fallback). It runs on the server with the
// request's auth cookies, so the browser client never queries hotels directly.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { findHotelOwnedByUser } from '@/lib/hotelAccess';
import { getAuthenticatedUser } from '@/lib/serverAuth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const owned = await findHotelOwnedByUser(user.id);
    if (!owned) {
      return NextResponse.json(
        { success: false, error: 'No hotel found for this user' },
        { status: 404 }
      );
    }

    const { data: hotel, error } = await supabaseAdmin
      .from('hotels')
      .select('*')
      .eq('id', owned.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, hotel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve hotel' },
      { status: 500 }
    );
  }
}
