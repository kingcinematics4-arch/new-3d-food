// app/api/orders/cancel/route.ts
// Customer-initiated order cancellation.
// The customer (guest) has no session, so ownership is verified by
// matching the customer_phone they provide against the order's stored
// phone number. Cancellation is only allowed while the order is pending
// or accepted — once the restaurant starts preparing, it is locked.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const CANCEL_STATUSES = ['pending', 'accepted'] as const;

const cancelOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  customer_phone: z.string().min(1, 'customer_phone is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = cancelOrderSchema.parse(body);

    // Fetch the order to verify existence, ownership and eligibility.
    // Only columns present since migration 001 are selected:
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status, customer_phone')
      .eq('id', validated.order_id)
      .single();

    if (fetchError || !currentOrder) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Customer ownership: the phone they provided must match the order's phone.
    if (currentOrder.customer_phone !== validated.customer_phone) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Phone number does not match this order.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Eligibility: only pending or accepted orders can be cancelled by the customer.
    const currentStatus = (currentOrder.status || '').trim().toLowerCase();
    if (!CANCEL_STATUSES.includes(currentStatus as any)) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: `Orders in "${currentStatus}" status cannot be cancelled.`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Update status to cancelled (updated_at set by trigger)
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', validated.order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the cancellation in history so staff can see it was customer-initiated
    await supabaseAdmin.from('order_status_history').insert({
      order_id: validated.order_id,
      status: 'cancelled',
      note: 'Cancelled by customer',
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
