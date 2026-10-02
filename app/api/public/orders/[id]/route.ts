// app/api/public/orders/[id]/route.ts
// Guest-facing read model behind /order-status/[orderId].
//
// A diner has no session, so this is the only way their order can be followed
// after checkout. The order id is an unguessable uuid that the guest received
// themselves, and only the columns a guest may see are selected - the
// restaurant id, the guest's phone number and internal notes are omitted.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'An order reference is required' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(
        'id, status, payment_status, payment_method, table_number, customer_name, total_amount, created_at, order_items (id, menu_item_id, quantity, price_at_time, notes)'
      )
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'We could not find that order' },
        { status: 404 }
      );
    }

    const { data: itemNames, error: namesError } = await supabaseAdmin
      .from('order_items')
      .select('id, menu_items (name)')
      .eq('order_id', orderId);

    if (namesError) throw namesError;

    const namesById = new Map(
      (itemNames || []).map((row: any) => [row.id, row.menu_items?.name || null])
    );

    const items = ((order as any).order_items || []).map((item: any) => ({
      id: item.id,
      name: namesById.get(item.id) || null,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      notes: item.notes,
    }));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        table_number: order.table_number,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        created_at: order.created_at,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load this order' },
      { status: 500 }
    );
  }
}