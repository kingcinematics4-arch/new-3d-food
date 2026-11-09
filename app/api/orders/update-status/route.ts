// app/api/orders/update-status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { isWaterOrder } from '@/lib/waterOrderHelper';

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
  cancellation_reason: z.string().optional(),
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

    // Fetch current order to validate transition.
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status, notes')
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

    const currentStatus = String(currentOrder.status || '').trim().toLowerCase();
    const requestedStatus = String(validated.status || '').trim().toLowerCase();

    if (currentStatus === requestedStatus) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', validated.order_id)
        .maybeSingle();
      return new NextResponse(JSON.stringify({
        success: true,
        noop: true,
        order: existingOrder || currentOrder,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Check whether this order is a water order (query order_items safely)
    let isWater = false;
    try {
      const { data: itemRows } = await supabaseAdmin
        .from('order_items')
        .select('id, notes, menu_item_id, quantity, price_at_time')
        .eq('order_id', validated.order_id);
      isWater = isWaterOrder({ notes: currentOrder.notes, order_items: itemRows || [] });
    } catch {
      isWater = isWaterOrder({ notes: currentOrder.notes });
    }

    // Water orders follow: [ORDER PLACED] -> [DELIVERED] directly (no accept/preparing/ready stages).
    // Food orders strictly follow VALID_TRANSITIONS.
    const baseTransitions = VALID_TRANSITIONS[currentStatus] || [];
    const allowedTransitions = isWater && !['delivered', 'completed', 'cancelled'].includes(currentStatus)
      ? Array.from(new Set([...baseTransitions, 'delivered']))
      : baseTransitions;

    if (!allowedTransitions.includes(requestedStatus)) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: `Invalid status transition: ${currentStatus} → ${requestedStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // 1. Update order status (updated_at will be set by trigger)
    const updatePayload: Record<string, any> = { status: requestedStatus };

    // If cancelling, record who initiated the cancellation (hotel/restaurant)
    if (requestedStatus === 'cancelled') {
      const cancellationSourceExists = await columnExists('orders', 'cancellation_source');
      const cancelledByExists = await columnExists('orders', 'cancelled_by');
      const cancelledAtExists = await columnExists('orders', 'cancelled_at');
      const cancellationReasonExists = await columnExists('orders', 'cancellation_reason');
      if (cancellationSourceExists) {
        updatePayload.cancellation_source = 'hotel';
      }
      if (cancelledByExists) {
        updatePayload.cancelled_by = 'restaurant';
      }
      if (cancelledAtExists) {
        updatePayload.cancelled_at = new Date().toISOString();
      }
      if (cancellationReasonExists) {
        if (validated.cancellation_reason) {
          updatePayload.cancellation_reason = validated.cancellation_reason;
        } else if (validated.note) {
          updatePayload.cancellation_reason = validated.note;
        } else if (!updatePayload.cancellation_reason) {
          updatePayload.cancellation_reason = 'Cancelled by hotel';
        }
      }
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', validated.order_id)
      .select('*, order_items(*)')
      .single();

    if (updateError) throw updateError;

    // 2. Add history record
    await supabaseAdmin.from('order_status_history').insert({
      order_id: validated.order_id,
      status: requestedStatus,
      note: validated.note || (isWater && requestedStatus === 'delivered' ? 'Water order delivered to table' : `Status changed to ${requestedStatus}`),
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

/**
 * Probe whether a column exists on a table. Returns false gracefully for
 * missing-column PostgREST codes (42703, PGRST204, PGRST205) instead of
 * throwing.
 */
async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(table)
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && ['42703', 'PGRST204', 'PGRST205'].includes(error.code)) return false;
    console.error(`[update-status] column probe for ${table}.${column} failed:`, error.message);
    return false;
  } catch (err: any) {
    console.error(`[update-status] column probe for ${table}.${column} threw:`, err?.message);
    return false;
  }
}
