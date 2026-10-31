// app/api/orders/cancel/route.ts
// Customer-initiated order cancellation.
//
// Ownership is verified by the order id itself: the customer reaches this
// endpoint from their own order tracking page (`/order/[orderId]`), which is
// the navigation they receive immediately after placing an order. No phone
// number is collected or validated anymore.
//
// Cancellation is only allowed while the order is pending or accepted — once
// the restaurant starts preparing, it is locked. A cancelled order cannot be
// cancelled again (duplicate prevention).
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { getOrdersSchema } from '@/lib/ordersSchema';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

const CANCEL_STATUSES = ['pending', 'accepted'] as const;

const CANCELLATION_REASONS = [
  'Dish not needed anymore',
  'Taking too much time',
  'Ordered by mistake',
  'Ordered the wrong item',
  'Found another option',
  'Other',
] as const;

const cancelOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  cancellation_reason: z
    .string()
    .min(1, 'A cancellation reason is required')
    .refine((val) => CANCELLATION_REASONS.includes(val as any), {
      message: 'Invalid cancellation reason',
    }),
  other_reason: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = cancelOrderSchema.parse(body);

    // Resolve the reason text: if "Other" was selected, use the free-text
    // explanation (falling back to "Other" when blank).
    const reasonText =
      validated.cancellation_reason === 'Other' && validated.other_reason
        ? validated.other_reason.trim() || 'Other'
        : validated.cancellation_reason;

    // Determine whether the incoming order_id is a stored DINE-<digits>
    // reference number or the raw uuid. The public orders route resolves
    // the same way: DINE references match orders.order_number, anything
    // else matches orders.id. This matters because the customer tracking
    // link can carry either identifier.
    const schema = await getOrdersSchema();
    const lookupColumn = schema.orderNumber && isStoredReferenceNumber(validated.order_id)
      ? 'order_number'
      : 'id';

    // Fetch the order to verify existence and eligibility.
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status, cancellation_reason, cancelled_by')
      .eq(lookupColumn, validated.order_id)
      .single();

    if (fetchError || !currentOrder) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Use the actual row id for all subsequent writes.
    const orderId = currentOrder.id;

    // Duplicate prevention: an already-cancelled order cannot be cancelled again.
    const currentStatus = (currentOrder.status || '').trim().toLowerCase();
    if (currentStatus === 'cancelled') {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'This order has already been cancelled.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }
      );
    }

    // Eligibility: only pending or accepted orders can be cancelled by the customer.
    if (!CANCEL_STATUSES.includes(currentStatus as any)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `Orders in "${currentStatus}" status cannot be cancelled.`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }
      );
    }

    // Update status to cancelled and record the reason + initiator.
    // updated_at is set by the orders_touch_updated_at trigger (migration 007).
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reasonText,
        cancelled_by: 'customer',
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the cancellation in history so staff can see it was customer-initiated.
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      status: 'cancelled',
      note: `Cancelled by customer — reason: ${reasonText}`,
    });

    return new NextResponse(JSON.stringify({ success: true, order: updatedOrder }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to cancel order' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
