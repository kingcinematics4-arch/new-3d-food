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
  const diagnostics: Record<string, any> = {};

  try {
    const body = await request.json();
    diagnostics.received_body = body;

    const validated = cancelOrderSchema.parse(body);
    diagnostics.validated_order_id = validated.order_id;
    diagnostics.validated_reason = validated.cancellation_reason;
    diagnostics.validated_other_reason = validated.other_reason;

    // Resolve the reason text: if "Other" was selected, use the free-text
    // explanation (falling back to "Other" when blank).
    const reasonText =
      validated.cancellation_reason === 'Other' && validated.other_reason
        ? validated.other_reason.trim() || 'Other'
        : validated.cancellation_reason;
    diagnostics.resolved_reason_text = reasonText;

    // Determine whether the incoming order_id is a stored DINE-<digits>
    // reference number or the raw uuid. The public orders route resolves
    // the same way: DINE references match orders.order_number, anything
    // else matches orders.id.
    const schema = await getOrdersSchema();
    diagnostics.schema_orderNumber = schema.orderNumber;
    diagnostics.schema_updatedAt = schema.updatedAt;

    const lookupColumn = schema.orderNumber && isStoredReferenceNumber(validated.order_id)
      ? 'order_number'
      : 'id';
    diagnostics.lookup_column = lookupColumn;

    // Fetch the order to verify existence and eligibility.
    // Only select columns guaranteed to exist since migration 001:
    // id, hotel_id, status. Do NOT select cancellation_reason / cancelled_by
    // here — those may not exist on the deployed database until migration 015
    // is applied. Selecting a missing column fails the whole query (42703).
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status')
      .eq(lookupColumn, validated.order_id)
      .single();

    diagnostics.fetch_error = fetchError?.message;
    diagnostics.fetch_error_code = fetchError?.code;
    diagnostics.current_order = currentOrder ? { id: currentOrder.id, status: currentOrder.status, hotel_id: currentOrder.hotel_id } : null;

    if (fetchError || !currentOrder) {
      diagnostics.outcome = 'order_not_found';
      console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Use the actual row id for all subsequent writes.
    const orderId = currentOrder.id;

    // Duplicate prevention: an already-cancelled order cannot be cancelled again.
    const currentStatus = (currentOrder.status || '').trim().toLowerCase();
    diagnostics.current_status = currentStatus;

    if (currentStatus === 'cancelled') {
      diagnostics.outcome = 'already_cancelled';
      console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
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
      diagnostics.outcome = 'ineligible_status';
      console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
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

    // Build the update object dynamically: only include columns that we know
    // exist on the orders table. `status` always exists. `cancellation_reason`
    // and `cancelled_by` only exist once migration 015 has been applied.
    const updatePayload: Record<string, any> = { status: 'cancelled' };

    // Probe whether cancellation columns exist before using them.
    const cancellationReasonExists = await columnExists('orders', 'cancellation_reason');
    const cancelledByExists = await columnExists('orders', 'cancelled_by');
    const cancellationSourceExists = await columnExists('orders', 'cancellation_source');
    const cancelledAtExists = await columnExists('orders', 'cancelled_at');
    diagnostics.cancellation_reason_exists = cancellationReasonExists;
    diagnostics.cancelled_by_exists = cancelledByExists;
    diagnostics.cancellation_source_exists = cancellationSourceExists;
    diagnostics.cancelled_at_exists = cancelledAtExists;

    if (cancellationReasonExists) {
      updatePayload.cancellation_reason = reasonText;
    }
    if (cancelledByExists) {
      updatePayload.cancelled_by = 'customer';
    }
    if (cancellationSourceExists) {
      updatePayload.cancellation_source = 'customer';
    }
    if (cancelledAtExists) {
      updatePayload.cancelled_at = new Date().toISOString();
    }

    diagnostics.update_payload = updatePayload;

    // Update status to cancelled and record the reason + initiator.
    const { data: updatedOrder, error: updateError, count: updateCount } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    diagnostics.update_error = updateError?.message;
    diagnostics.update_error_code = updateError?.code;
    diagnostics.update_count = updateCount;
    diagnostics.updated_order = updatedOrder ? { id: updatedOrder.id, status: updatedOrder.status } : null;

    if (updateError) {
      console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
      throw updateError;
    }

    // Log the cancellation in history so staff can see it was customer-initiated.
    const historyNote = `Cancelled by customer — reason: ${reasonText}`;
    const { error: historyError } = await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      status: 'cancelled',
      note: historyNote,
    });

    diagnostics.history_error = historyError?.message;
    diagnostics.history_error_code = historyError?.code;

    if (historyError) {
      console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
      throw historyError;
    }

    diagnostics.outcome = 'success';
    console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));

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
    diagnostics.outcome = 'error';
    diagnostics.error_message = error?.message || 'Unknown error';
    diagnostics.error_code = error?.code;
    console.error('[cancel] diagnostics:', JSON.stringify(diagnostics, null, 2));
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
    console.error(`[cancel] column probe for ${table}.${column} failed:`, error.message);
    return false;
  } catch (err: any) {
    console.error(`[cancel] column probe for ${table}.${column} threw:`, err?.message || err);
    return false;
  }
}
