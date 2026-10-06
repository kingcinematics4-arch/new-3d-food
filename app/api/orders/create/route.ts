// app/api/orders/create/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { orderReference } from '@/lib/orderReference';
import { z } from 'zod';

const createOrderSchema = z.object({
  hotel_id: z.string().min(1, 'hotel_id is required'),
  table_number: z.string().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  order_type: z.enum(['dine_in', 'takeaway']).default('dine_in'),
  payment_method: z.enum(['pay_at_table', 'card', 'upi']).default('pay_at_table'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      menu_item_id: z.string().min(1),
      quantity: z.number().int().positive(),
      price_at_time: z.number().positive(),
      notes: z.string().optional(),
    })
  ).min(1, 'Order must contain at least one item'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Calculate total amount
    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.price_at_time * item.quantity,
      0
    );

    // The customer-facing reference number (e.g. DINE-10482) is
    // assigned by the database BEFORE INSERT trigger
    // (orders_set_order_number) when migration 008 has been applied.
    // On deployments that have not run 008 yet there is no
    // order_number column, so the reference is derived from the
    // stored row's permanent uuid instead (see lib/orderReference).
    // Either way it comes from the created row itself and is
    // returned to the caller together with the row's id, which is
    // the identifier the tracking page resolves by.
    // 1. Insert Order
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        hotel_id: validated.hotel_id,
        table_number: validated.table_number || 'Takeaway',
        customer_name: validated.customer_name || 'Guest',
        customer_phone: validated.customer_phone,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: validated.payment_method,
        notes: validated.notes,
      })
      .select()
      .single();

    if (orderError) throw new Error(`Order insertion failed: ${orderError.message}`);

    // The permanent reference shown to the customer: the stored
    // order_number when the database provides one, otherwise a
    // stable code derived from the row's id.
    const storedOrderNumber = (orderData as any).order_number || null;
    const reference = orderReference({ id: orderData.id, order_number: storedOrderNumber });

    // 2. Insert Order Items
    const orderItemsToInsert = validated.items.map((item) => ({
      order_id: orderData.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      notes: item.notes || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw new Error(`Order items insertion failed: ${itemsError.message}`);

    // 3. Log initial order status in history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderData.id,
      status: 'pending',
      note: 'Order submitted by customer',
    });

    return NextResponse.json(
      {
        success: true,
        // The identifier the tracking page resolves the order by:
        // the row's permanent primary key. It is stable and works
        // whether or not migration 008 has been applied.
        orderId: orderData.id,
        orderNumber: reference,
        orderCode: reference,
        order: { ...orderData, order_number: storedOrderNumber || reference },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to place order',
      },
      { status: 400 }
    );
  }
}
