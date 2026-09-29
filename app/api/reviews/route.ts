// app/api/reviews/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotel_id is required' },
        { status: 400 }
      );
    }

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, reviews: reviews || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}