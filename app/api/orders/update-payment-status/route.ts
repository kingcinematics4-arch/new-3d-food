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

/** Resolve the Google Review URL for the exact hotel that owns this order.
 *  Uses the service-role client (server-side only) so public/guest flows
 *  are not blocked by RLS; never uses the admin's session hotel context. */
async function getHotelReviewUrl(hotelId: string | null | undefined): Promise<string | null> {
  if (!hotelId) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('google_review_url')
      .eq('id', hotelId)
      .maybeSingle();
    if (error) {
      // Missing column on older deployments — treat as not configured.
      if (error.code && ['42703', 'PGRST204', 'PGRST205'].includes(error.code)) return null;
      console.error('[update-payment-status] hotel review URL lookup failed:', error.message);
      return null;
    }
    const url = (data as any)?.google_review_url;
    return typeof url === 'string' && url.trim() ? url : null;
  } catch (err: any) {
    console.error('[update-payment-status] hotel review URL lookup threw:', err?.message);
    return null;
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

    // Duplicate/no-op writes return success without touching the DB.
    // Still attach the hotel's google_review_url (resolved from the
    // order's own hotel_id) so the guest tracking page can redirect
    // even when the payment transition is a no-op.
    if (currentOrder.payment_status === validated.payment_status) {
      const reviewUrl = await getHotelReviewUrl(currentOrder.hotel_id);
      return new NextResponse(JSON.stringify({ success: true, order: { ...currentOrder, google_review_url: reviewUrl } }), {
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

    // Attach the hotel's google_review_url (resolved from the order's own
    // hotel_id) so the guest tracking page can redirect after payment.
    const reviewUrl = await getHotelReviewUrl(currentOrder.hotel_id);
    const responseOrder = { ...updatedOrder, google_review_url: reviewUrl };
    return new NextResponse(JSON.stringify({ success: true, order: responseOrder }), {
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
