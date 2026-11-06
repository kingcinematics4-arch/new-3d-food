// app/api/orders/update-payment-status/route.ts
// Set the payment_status of an order to 'paid' (or back to 'unpaid').
// Payment status is fully independent of order preparation status
// (pending/accepted/preparing/ready/completed).
//
// Business rules:
//   • Only orders in 'completed' status can be marked as PAID.
//   • Only orders NOT cancelled can be marked as PAID.
//   • Duplicate/no-op writes return success without touching the DB.
//   • paid_at is set when transitioning to 'paid', cleared on 'unpaid'.
//
// The response always includes the hotel's google_review_url (when the
// column exists on this deployment) so the guest tracking page can
// redirect to it the moment payment is confirmed.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

const updatePaymentStatusSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  payment_status: z.enum(['paid', 'unpaid']),
});

/** Probe whether a column exists on a table. Returns false gracefully for
 * missing-column PostgREST codes (42703, PGRST204, PGRST205) instead of
 * throwing. */
async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(table)
      .select(column)
      .limit(1);
    if (!error) return true;
    if (error.code && ['42703', 'PGRST204', 'PGRST205'].includes(error.code)) return false;
    console.error(`[update-payment-status] column probe for ${table}.${column} failed:`, error.message);
    return false;
  } catch (err: any) {
    console.error(`[update-payment-status] column probe for ${table}.${column} threw:`, err?.message);
    return false;
  }
}

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

    // Fetch current order to validate ownership, status and transition
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, payment_status, status')
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

    const isCompleted = (currentOrder.status || '').trim().toLowerCase() === 'completed';
    const isCancelled = (currentOrder.status || '').trim().toLowerCase() === 'cancelled';

    // PAID can only be set on a completed, non-cancelled order
    if (validated.payment_status === 'paid') {
      if (isCancelled) {
        return new NextResponse(JSON.stringify({ success: false, error: 'Cannot mark a cancelled order as paid.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
      if (!isCompleted) {
        return new NextResponse(JSON.stringify({ success: false, error: 'Order must be completed before payment can be marked.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        });
      }
    }

    // Duplicate/no-op writes return success without touching the DB
    if (currentOrder.payment_status === validated.payment_status) {
      return new NextResponse(JSON.stringify({ success: true, order: currentOrder }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Build update payload: payment_status + paid_at timestamp
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      payment_status: validated.payment_status,
      updated_at: now,
    };
    if (validated.payment_status === 'paid') {
      updatePayload.paid_at = now;
    } else {
      updatePayload.paid_at = null;
    }

    // Update payment status only — order status is untouched
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', validated.order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Attach the hotel's google_review_url (when the column exists on this
    // deployment) so the guest tracking page can redirect after payment.
    const googleReviewUrl = await columnExists('hotels', 'google_review_url');
    let reviewUrl: string | null = null;
    if (googleReviewUrl) {
      const { data: hotelRow } = await supabaseAdmin
        .from('hotels')
        .select('google_review_url')
        .eq('id', currentOrder.hotel_id)
        .maybeSingle();
      reviewUrl = (hotelRow as any)?.google_review_url || null;
    }

    return new NextResponse(JSON.stringify({ success: true, order: { ...updatedOrder, google_review_url: reviewUrl } }), {
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
