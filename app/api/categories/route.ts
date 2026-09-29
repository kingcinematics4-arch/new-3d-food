// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedHotelId = searchParams.get('hotel_id');

    // Falls back to the authenticated user's own hotel when the client does not
    // (or cannot) know the id yet.
    let hotelId = requestedHotelId;
    if (!hotelId) {
      const access = await requireOwnedHotelId(null);
      if (!access.ok) {
        return NextResponse.json({ success: false, error: access.error }, { status: access.status });
      }
      hotelId = access.hotelId;
    }

    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('position', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, categories: categories || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotel_id: requestedHotelId, name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    const access = await requireOwnedHotelId(requestedHotelId);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ hotel_id: access.hotelId, name, position: 0 })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 400 }
    );
  }
}
