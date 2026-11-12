// app/api/public/orders/active/route.ts
// Guest-facing lookup: returns the active unpaid order for a hotel+table,
// or null if none exists. Used by the menu page (QR scan) to recover
// an existing order instead of creating a duplicate.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema } from '@/lib/ordersSchema';
import { orderReference } from '@/lib/orderReference';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');
    const tableNumber = searchParams.get('table_number');

    if (!hotelId || !tableNumber) {
      return new NextResponse(JSON.stringify({ success: false, error: 'hotel_id and table_number are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const schema = await getOrdersSchema();

    interface ActiveOrderRow {
  id: string;
  hotel_id: string;
  table_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_number?: string | null;
  updated_at?: string | null;
}

// Active unpaid order = payment_status != 'paid' AND status != 'cancelled'
    // This matches the spec: pending/accepted/preparing/ready/completed/delivered all keep tracking alive
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select([
        'id',
        'hotel_id',
        'table_number',
        'status',
        'payment_status',
        'payment_method',
        'total_amount',
        'created_at',
        ...(schema.orderNumber ? ['order_number'] : []),
        ...(schema.updatedAt ? ['updated_at'] : []),
      ].join(', '))
      .eq('hotel_id', hotelId)
      .eq('table_number', tableNumber)
      .neq('payment_status', 'paid')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ActiveOrderRow>();

    if (error) throw error;

    if (!order) {
      return new NextResponse(JSON.stringify({ success: true, order: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const reference = orderReference({ id: order.id, order_number: (order as any).order_number || null });

    return new NextResponse(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: reference,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        table_number: order.table_number,
        total_amount: order.total_amount,
        created_at: order.created_at,
        ...(schema.updatedAt ? { updated_at: (order as any).updated_at } : {}),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to check active order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}