// app/api/public/orders/history/route.ts
// Guest-facing endpoint: returns all orders for a hotel+table combination.
// Used by the "Your Orders" page to display order history with live tracking.
// Accepts either hotel_id or hotel_slug (resolves slug to ID).

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import { getHotelSchema } from '@/lib/hotelSchema';
import { orderReference } from '@/lib/orderReference';
import { normalizeCurrency } from '@/lib/menu';
import {
  resolveItemProperties,
  parseWaterFromNotes,
  cleanWaterNotes,
  isWaterOrder,
  isWaterItem,
} from '@/lib/waterOrderHelper';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

export const dynamic = 'force-dynamic';

async function resolveHotelId(hotelIdOrSlug: string): Promise<string | null> {
  // Check if it's a UUID (hotel_id) or a slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hotelIdOrSlug);
  if (isUuid) return hotelIdOrSlug;

  // Resolve slug to hotel_id
  const { data: hotel } = await supabaseAdmin
    .from('hotels')
    .select('id')
    .eq('slug', hotelIdOrSlug)
    .maybeSingle();
  return hotel?.id || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelIdOrSlug = searchParams.get('hotel_id') || searchParams.get('hotel_slug');
    const tableNumber = searchParams.get('table_number');

    if (!hotelIdOrSlug || !tableNumber) {
      return new NextResponse(JSON.stringify({ success: false, error: 'hotel_id (or hotel_slug) and table_number are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const hotelId = await resolveHotelId(hotelIdOrSlug);
    if (!hotelId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Hotel not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const schema = await getOrdersSchema();
    const hotelSchema = await getHotelSchema();
    const itemSchema = await getOrderItemsSchema();

    // Fetch all orders for this hotel+table (including paid and cancelled for history)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select([
        'id',
        'hotel_id',
        'table_number',
        'status',
        'payment_status',
        'payment_method',
        'total_amount',
        'created_at',
        ...(schema.orderNumber ? ['order_number'] : []),
        ...(schema.updatedAt ? ['updated_at'] : []),
        'notes',
        'linked_order_id',
        `hotels (id, slug, currency)`,
      ].join(', '))
      .eq('hotel_id', hotelId)
      .eq('table_number', tableNumber)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return new NextResponse(JSON.stringify({ success: true, orders: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // For each order, fetch items and build the response
    const orderIds = orders.map((o: any) => o.id);

    // Fetch all order items for these orders with order_id
    const itemSelectColumns = [
      'id',
      'menu_item_id',
      'quantity',
      'price_at_time',
      'notes',
      ...(itemSchema.itemName ? ['item_name'] : []),
      ...(itemSchema.itemKind ? ['item_kind'] : []),
      ...(itemSchema.status ? ['status'] : []),
      ...(itemSchema.cancelledAt ? ['cancelled_at'] : []),
      ...(itemSchema.cancellationReason ? ['cancellation_reason'] : []),
      ...(itemSchema.cancelledBy ? ['cancelled_by'] : []),
      ...(itemSchema.sizeId ? ['size_id'] : []),
      ...(itemSchema.sizeName ? ['size_name'] : []),
      ...(itemSchema.sizePrice ? ['size_price'] : []),
      'menu_items (name)',
    ].join(', ');

    const { data: orderItemsWithOrderId } = await supabaseAdmin
      .from('order_items')
      .select(`order_id, ${itemSelectColumns}`)
      .in('order_id', orderIds);

    const itemsByOrderMap = new Map<string, any[]>();
    (orderItemsWithOrderId || []).forEach((item: any) => {
      const oid = item.order_id;
      if (!itemsByOrderMap.has(oid)) itemsByOrderMap.set(oid, []);
      itemsByOrderMap.get(oid)!.push(item);
    });

    // Fetch payments for all orders
    const { data: allPayments } = await supabaseAdmin
      .from('order_payments')
      .select('order_id, amount, status')
      .in('order_id', orderIds)
      .eq('status', 'successful');

    const paymentsByOrder = new Map<string, number>();
    (allPayments || []).forEach((p: any) => {
      const oid = p.order_id;
      const amt = Number(p.amount || 0);
      paymentsByOrder.set(oid, (paymentsByOrder.get(oid) || 0) + amt);
    });

    // Fetch linked orders (water orders linked to food orders)
    const { data: linkedOrders } = await supabaseAdmin
      .from('orders')
      .select('id, linked_order_id, total_amount, status, payment_status, table_number, created_at, notes')
      .in('linked_order_id', orderIds);

    const linkedOrdersByParent = new Map<string, any[]>();
    (linkedOrders || []).forEach((lo: any) => {
      const parentId = lo.linked_order_id;
      if (!linkedOrdersByParent.has(parentId)) linkedOrdersByParent.set(parentId, []);
      linkedOrdersByParent.get(parentId)!.push(lo);
    });

    // Also fetch orders that are linked TO these orders (child water orders)
    const { data: childOrders } = await supabaseAdmin
      .from('orders')
      .select('id, linked_order_id, total_amount, status, payment_status, table_number, created_at, notes')
      .in('id', orderIds)
      .not('linked_order_id', 'is', null);

    const childOrdersByParent = new Map<string, any[]>();
    (childOrders || []).forEach((co: any) => {
      const parentId = co.linked_order_id;
      if (!childOrdersByParent.has(parentId)) childOrdersByParent.set(parentId, []);
      childOrdersByParent.get(parentId)!.push(co);
    });

    // Pre-calculate combined bill totals for all orders with linked orders
    const allLinkedOrderIds = new Set<string>();
    orders.forEach((order: any) => {
      const linkedOrderIds = linkedOrdersByParent.get(order.id) || [];
      const childOrderIds = childOrdersByParent.get(order.id) || [];
      [...linkedOrderIds, ...childOrderIds].forEach((o: any) => allLinkedOrderIds.add(o.id));
    });

    let linkedOrderTotalsMap = new Map<string, number>();
    if (allLinkedOrderIds.size > 0) {
      const { data: linkedOrderTotals } = await supabaseAdmin
        .from('orders')
        .select('id, total_amount')
        .in('id', Array.from(allLinkedOrderIds));
      if (linkedOrderTotals) {
        linkedOrderTotals.forEach((o: any) => {
          linkedOrderTotalsMap.set(o.id, Number(o.total_amount || 0));
        });
      }
    }

    // Build response
    const processedOrders = orders.map((order: any) => {
      const orderId = order.id;
      const orderItems = itemsByOrderMap.get(orderId) || [];
      const linkedOrderIds = linkedOrdersByParent.get(orderId) || [];
      const childOrderIds = childOrdersByParent.get(orderId) || [];
      const allLinkedOrderIds = [...linkedOrderIds, ...childOrderIds].map((o: any) => o.id);
      const allOrderIdsForBilling = [orderId, ...allLinkedOrderIds];

      // Process items
      let items = orderItems.map((item: any) => {
        const resolved = resolveItemProperties(item, order.notes);
        const priceAtTime = resolved.price_at_time;
        const quantity = resolved.quantity;
        return {
          id: item.id,
          name: resolved.name,
          quantity,
          price_at_time: priceAtTime,
          line_total: priceAtTime * quantity,
          notes: resolved.notes,
          item_kind: resolved.item_kind,
          ...(itemSchema.status ? { status: item.status ?? 'active' } : {}),
          ...(itemSchema.cancelledAt ? { cancelled_at: item.cancelled_at ?? null } : {}),
          ...(itemSchema.cancellationReason ? { cancellation_reason: item.cancellation_reason ?? null } : {}),
          ...(itemSchema.cancelledBy ? { cancelled_by: item.cancelled_by ?? null } : {}),
          ...(itemSchema.sizeId ? { size_id: item.size_id || null } : {}),
          ...(itemSchema.sizeName ? { size_name: item.size_name || null } : {}),
          ...(itemSchema.sizePrice ? { size_price: item.size_price !== undefined ? Number(item.size_price) : null } : {}),
        };
      });

      // Synthetic integration for historical water orders missing order_items rows
      if (items.length === 0) {
        const waterFromNotes = parseWaterFromNotes(order.notes);
        if (waterFromNotes) {
          const unitPrice = Number(order.total_amount) || 0;
          const qty = waterFromNotes.quantity || 1;
          items = [
            {
              id: `syn-${order.id}`,
              name: waterFromNotes.name,
              quantity: qty,
              price_at_time: unitPrice,
              line_total: unitPrice * qty,
              notes: null,
              item_kind: 'water',
              status: 'active',
            },
          ];
        }
      }

      const isWater = isWaterOrder({ notes: order.notes, order_items: items });
      const cleanOrderNotes = isWater ? cleanWaterNotes(order.notes) : (order.notes || null);

      const reference = orderReference(order as { id: string; order_number?: string | null });

      // Calculate combined bill total
      let combinedBillTotal = Number(order.total_amount || 0);
      const allLinkedOrderIdsForOrder = [...linkedOrderIds, ...childOrderIds].map((o: any) => o.id);
      if (allLinkedOrderIdsForOrder.length > 0) {
        const linkedTotals = allLinkedOrderIdsForOrder.reduce((sum: number, oid: string) => sum + (linkedOrderTotalsMap.get(oid) || 0), 0);
        combinedBillTotal += linkedTotals;
      }

      const totalPaid = paymentsByOrder.get(orderId) || 0;
      const remainingBalance = Math.max(0, Math.round((combinedBillTotal - totalPaid) * 100) / 100);

      // Water charges
      const waterItemsOnOrder = items.filter((item: any) => isWaterItem(item));
      let waterCharges = waterItemsOnOrder.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);

      // Food items only
      const foodItems = items.filter((item: any) => !isWaterItem(item));

      // Hotel slug for navigation
      const orderHotelSlug = order.hotels?.slug || null;
      const currency = normalizeCurrency(order.hotels?.currency || null);

      return {
        id: order.id,
        hotel_id: order.hotel_id,
        order_number: reference,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        table_number: order.table_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        notes: cleanOrderNotes,
        total_amount: combinedBillTotal,
        amount_paid: totalPaid,
        remaining_balance: remainingBalance,
        water_charges: waterCharges,
        linked_order_id: order.linked_order_id || null,
        linked_orders: linkedOrderIds,
        combined_items: items,
        combined_bill_total: combinedBillTotal,
        created_at: order.created_at,
        ...(schema.updatedAt ? { updated_at: order.updated_at } : {}),
        items: foodItems,
        hotel_slug: orderHotelSlug,
        currency,
      };
    });

    return new NextResponse(JSON.stringify({
      success: true,
      orders: processedOrders,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to fetch order history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}