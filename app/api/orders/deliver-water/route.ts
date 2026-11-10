// app/api/orders/deliver-water/route.ts
// Independent water-order delivery endpoint.
// Completely separate from food-order status validation.
// Sets water_delivered flag (NOT the shared status field) and adds water
// charges to the parent food order's bill exactly once.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { z } from 'zod';

const deliverWaterSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = deliverWaterSchema.parse(body);

    // Verify hotel ownership
    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return new NextResponse(JSON.stringify({ success: false, error: access.error }), {
        status: access.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Fetch the order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status, linked_order_id, water_delivered, water_charges_added')
      .eq('id', validated.order_id)
      .single();

    if (orderErr || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Verify hotel ownership
    if (order.hotel_id !== access.hotelId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Verify this is a water order (has linked_order_id pointing to parent food order)
    if (!order.linked_order_id) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Not a water order' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Idempotency: if already delivered, return early — no duplicate charges
    if (order.water_delivered === true) {
      return new NextResponse(JSON.stringify({
        success: true,
        already_delivered: true,
        message: 'Water order already delivered; charges already billed',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Use the RPC function for atomic delivery + billing
    const { data: rpcResult, error: rpcErr } = await supabaseAdmin
      .rpc('deliver_water_order', { water_order_id: validated.order_id });

    if (rpcErr) throw rpcErr;

    if (!rpcResult || !rpcResult.success) {
      return new NextResponse(JSON.stringify({
        success: false,
        error: rpcResult?.error || 'Failed to deliver water order',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Fetch updated order for response
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .select('id, status, linked_order_id, water_delivered, water_charges_added, total_amount, updated_at')
      .eq('id', validated.order_id)
      .single();

    return new NextResponse(JSON.stringify({
      success: true,
      order: updatedOrder,
      water_billing: rpcResult,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to deliver water order' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
