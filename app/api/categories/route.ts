// app/api/categories/route.ts
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
    const { hotel_id, name } = body;

    if (!hotel_id || !name) {
      return NextResponse.json(
        { success: false, error: 'hotel_id and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ hotel_id, name, position: 0 })
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
