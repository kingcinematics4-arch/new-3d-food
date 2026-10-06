// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema } from '@/lib/ordersSchema';

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

    // `order_number` and `updated_at` only exist once migrations
    // 008/007 have been applied to this deployment. They are never
    // listed explicitly here (`*` already covers them when present)
    // and the incremental `since` filter is skipped when the
    // updated_at column has not been created, because selecting a
    // missing column fails the whole query (42703).
    const schema = await getOrdersSchema();

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

    if (since && schema.updatedAt) {
      query = query.gte('updated_at', since);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Transform order_items to have menu_item (singular) with name for frontend compatibility
    const transformedOrders = (orders || []).map((order: any) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        menu_item: item.menu_items ? { name: item.menu_items.name } : null,
      })),
    }));

    return new NextResponse(JSON.stringify({ success: true, orders: transformedOrders }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to fetch orders' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}