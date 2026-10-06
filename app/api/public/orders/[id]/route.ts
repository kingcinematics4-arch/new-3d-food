// app/api/public/orders/[id]/route.ts
// Guest-facing read model behind /order-status/[orderId].
//
// A diner has no session, so this is the only way their order can be followed
// after checkout. The route accepts EITHER the permanent reference number
// (DINE-XXXXX) or the raw uuid -- the customer only ever sees the reference
// number, but keeping the uuid path means existing links keep working.
// Only the columns a guest may see are selected: the restaurant id, the guest's
// phone number and internal notes are omitted.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function isReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'An order reference is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Resolve by the permanent reference number when one was supplied, else by
    // the raw uuid. Both columns are indexed so either path is fast.
    const column = isReferenceNumber(orderId) ? 'order_number' : 'id';

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, status, payment_status, payment_method, table_number, customer_name, total_amount, created_at, updated_at, order_items (id, menu_item_id, quantity, price_at_time, notes, menu_items (name))'
      )
      .eq(column, orderId)
      .maybeSingle();

    if (error) throw error;

    if (!order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'We could not find that order' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Transform order_items to have menu_item (singular) with name for frontend compatibility
    const items = ((order as any).order_items || []).map((item: any) => ({
      id: item.id,
      name: item.menu_items?.name || null,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      notes: item.notes,
    }));

    return new NextResponse(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        table_number: order.table_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to load this order' }), {
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