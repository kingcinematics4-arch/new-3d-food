// app/api/orders/update-payment-status/route.ts
// Toggle the payment_status of an order between 'paid' and 'unpaid'.
// Payment status is fully independent of order preparation status
// (pending/accepted/preparing/ready/completed).
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

const updatePaymentStatusSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  payment_status: z.enum(['paid', 'unpaid']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = updatePaymentStatusSchema.parse(body);

    // Verify the order belongs to the authenticated hotel
    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return new NextResponse(JSON.stringify({ success: false, error: access.error }), {
        status: access.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Fetch current order to validate ownership and transition
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, payment_status')
      .eq('id', validated.order_id)
      .single();

    if (fetchError || !currentOrder) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Verify hotel ownership
    if (currentOrder.hotel_id !== access.hotelId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Only toggle if different (avoid no-op writes)
    if (currentOrder.payment_status === validated.payment_status) {
      return new NextResponse(JSON.stringify({ success: true, order: currentOrder }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Update payment status only — order status is untouched
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: validated.payment_status })
      .eq('id', validated.order_id)
      .select()
      .single();

    if (updateError) throw updateError;

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
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to update payment status' }), {
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
