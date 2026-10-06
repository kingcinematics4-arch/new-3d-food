// app/api/orders/update-status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'preparing', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'completed', 'cancelled'],
  delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const updateStatusSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  status: z.enum(VALID_STATUSES),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    // Verify the order belongs to the authenticated hotel
    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return new NextResponse(JSON.stringify({ success: false, error: access.error }), {
        status: access.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Fetch current order to validate transition. Only columns
    // that have existed since migration 001 are selected:
    // orders.order_number is absent until migration 008 is
    // applied, and listing it here would fail the whole query.
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status')
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

    // Validate status transition
    const currentStatus = currentOrder.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(validated.status)) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: `Invalid status transition: ${currentStatus} → ${validated.status}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // 1. Update order status (updated_at will be set by trigger)
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: validated.status })
      .eq('id', validated.order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Add history record
    await supabaseAdmin.from('order_status_history').insert({
      order_id: validated.order_id,
      status: validated.status,
      note: validated.note || `Status changed to ${validated.status}`,
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
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to update order status' }), {
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
