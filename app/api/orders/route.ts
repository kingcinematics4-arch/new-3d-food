// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');
    const since = searchParams.get('since');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotel_id is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          price_at_time,
          notes,
          menu_items ( name )
        )
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}