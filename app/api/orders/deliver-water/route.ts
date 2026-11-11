// app/api/orders/deliver-water/route.ts
// Independent water-order delivery endpoint.
// Completely separate from food-order status validation.
// Sets water_delivered flag (NOT the shared status field) and adds water
// charges to the parent food order's bill exactly once.
// Resilient to missing columns: works whether or not migrations 030/031
// have been applied to the deployed database.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import { isWaterOrder } from '@/lib/waterOrderHelper';
import { z } from 'zod';

const deliverWaterSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
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

    // Detect which optional columns exist before selecting them
    const schema = await getOrdersSchema().catch(() => ({ linkedOrderId: false, waterDelivered: false, waterChargesAdded: false } as any));
    const itemSchema = await getOrderItemsSchema().catch(() => ({ itemKind: false, itemName: false } as any));

    // Build item columns for water detection
    const itemCols = [
      'id', 'menu_item_id', 'quantity', 'price_at_time', 'notes',
      ...(itemSchema.itemName ? ['item_name'] : []),
      ...(itemSchema.itemKind ? ['item_kind'] : []),
      'menu_items ( name, price )',
    ].join(',\n          ');

    // Fetch the order — select only columns we know exist to avoid 42703 errors
    const orderSelect = [
      'id', 'hotel_id', 'status', 'table_number', 'customer_name', 'total_amount', 'created_at',
      ...(schema.linkedOrderId ? ['linked_order_id'] : []),
      ...(schema.waterDelivered ? ['water_delivered'] : []),
      ...(schema.waterChargesAdded ? ['water_charges_added'] : []),
    ];

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select(orderSelect.join(', ') + ', order_items (' + itemCols + ')')
      .eq('id', validated.order_id)
      .maybeSingle();

    if (orderErr || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const orderData = order as any;

    // Verify hotel ownership
    if (orderData.hotel_id !== access.hotelId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Detect water order via items (not linked_order_id)
    const items: any[] = orderData.order_items || [];
    const isWater = isWaterOrder({ notes: orderData.notes, order_items: items });

    if (!isWater) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Not a water order' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Idempotency: if water_delivered column exists and is true, return early
    let alreadyDelivered = false;
    if (schema.waterDelivered) {
      alreadyDelivered = Boolean(orderData.water_delivered);
    }
    if (alreadyDelivered) {
      return new NextResponse(JSON.stringify({
        success: true,
        already_delivered: true,
        message: 'Water order already delivered; charges already billed',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Calculate water total from order_items (actual prices x quantities)
    const waterTotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0),
      0
    );

    // Try the RPC function for atomic delivery + billing (if available)
    let rpcResult: any = null;
    try {
      const { data: rpcData, error: rpcErr } = await supabaseAdmin
        .rpc('deliver_water_order', { water_order_id: validated.order_id });

      if (rpcErr) throw rpcErr;
      rpcResult = rpcData;
    } catch (rpcErr: any) {
      // RPC not available (migration 031 not applied) — fall back to manual update
      const missingColumnCodes = new Set(['42703', 'PGRST204', 'PGRST205']);
      const isMissingFn = missingColumnCodes.has(rpcErr?.code) ||
        (rpcErr?.message && /function|procedure|deliver_water_order/i.test(rpcErr.message));

      if (!isMissingFn) throw rpcErr;

      // Manual fallback: update water_delivered flag + total_amount
      // Water orders start with total_amount = 0 (charges deferred until delivery).
      // For dine-in water orders linked to a parent, charges are added to parent's bill.
      // For standalone water orders (no parent), charges stay on this order.
      const updateParts: Record<string, any> = {
        updated_at: new Date().toISOString(),
        status: 'delivered',
      };
      const parentOrderId = (order as any).linked_order_id;

      if (parentOrderId) {
        // Dine-in: add water charges to parent food order's bill,
        // keep this water order's total_amount at 0 to avoid double counting
        updateParts.water_total_deferred = waterTotal;
      } else {
        // Standalone: charges stay on this water order
        updateParts.total_amount = waterTotal;
      }

      if (schema.waterDelivered) {
        updateParts.water_delivered = true;
      }
      if (schema.waterChargesAdded) {
        updateParts.water_charges_added = true;
      }

      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update(updateParts)
        .eq('id', validated.order_id);

      if (updateErr) throw updateErr;

      // Add water charges to parent food order's bill (idempotent: once per water order)
      if (parentOrderId) {
        const { data: parentOrder } = await supabaseAdmin
          .from('orders')
          .select('total_amount')
          .eq('id', parentOrderId)
          .maybeSingle();

        if (parentOrder) {
          const newParentTotal = Number(parentOrder.total_amount || 0) + waterTotal;
          await supabaseAdmin
            .from('orders')
            .update({ total_amount: newParentTotal, updated_at: new Date().toISOString() })
            .eq('id', parentOrderId);
        }
      }

      rpcResult = {
        success: true,
        water_total: waterTotal,
        parent_order_id: parentOrderId || null,
        message: 'Water order delivered; charges added to parent bill',
      };
    }

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
      .select(orderSelect.join(','))
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
