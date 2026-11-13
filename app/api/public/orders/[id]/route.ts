// app/api/public/orders/[id]/route.ts
// Guest-facing read model behind /order/[orderId].
// Validates that the order belongs to the hotel identified by the slug param.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import { getHotelSchema } from '@/lib/hotelSchema';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { normalizeCurrency } from '@/lib/menu';
import { orderReference } from '@/lib/orderReference';
import { getHotelGoogleReviewUrl, getStoredCustomTheme } from '@/lib/customThemeStore.server';
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(_request.url);
    const hotelSlug = searchParams.get('slug');

    if (!orderId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'An order reference is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const schema = await getOrdersSchema();
    const hotelSchema = await getHotelSchema();
    const itemSchema = await getOrderItemsSchema();

    const column = schema.orderNumber && isStoredReferenceNumber(orderId)
      ? 'order_number'
      : 'id';

    const hotelSelect = [
      'id',
      hotelSchema.menuTheme ? 'menu_theme' : '',
      hotelSchema.customThemeConfig ? 'custom_theme_config' : '',
      hotelSchema.googleReviewUrl ? 'google_review_url' : '',
      'slug',
      hotelSchema.currency ? 'currency' : '',
    ].filter(Boolean).join(', ');

    const orderSelectColumns = [
      'id',
      'hotel_id',
      'status',
      'payment_status',
      'payment_method',
      'table_number',
      'customer_name',
      'customer_phone',
      'notes',
      'total_amount',
      'created_at',
      `hotels (${hotelSelect})`,
      ...(schema.orderNumber ? ['order_number'] : []),
      ...(schema.updatedAt ? ['updated_at'] : []),
    ];

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
    ];

    const { data: rawOrder, error } = await supabaseAdmin
      .from('orders')
      .select([...orderSelectColumns, `order_items (${itemSelectColumns.join(', ')})`].join(', '))
      .eq(column, orderId)
      .maybeSingle();

    if (error) throw error;

    const order = rawOrder as any;

    if (!order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'We could not find that order' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    // Security: Validate that the order belongs to the hotel from the slug parameter.
    // This prevents users from accessing orders of other hotels by guessing order IDs.
    const orderHotelSlug = (order as any).hotels?.slug;
    if (hotelSlug && orderHotelSlug && hotelSlug !== orderHotelSlug) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found for this restaurant' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    let items = ((order as any).order_items || []).map((item: any) => {
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
        // Size fields
        size_id: item.size_id || null,
        size_name: item.size_name || null,
        size_price: item.size_price !== undefined ? Number(item.size_price) : null,
        ...(itemSchema.status ? { status: item.status ?? 'active' } : {}),
        ...(itemSchema.cancelledAt ? { cancelled_at: item.cancelled_at ?? null } : {}),
        ...(itemSchema.cancellationReason ? { cancellation_reason: item.cancellation_reason ?? null } : {}),
        ...(itemSchema.cancelledBy ? { cancelled_by: item.cancelled_by ?? null } : {}),
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

    const orderHotelId = (order as any).hotel_id || (order as any).hotels?.id || null;
    let googleReviewUrl: string | null = (order as any).hotels?.google_review_url || null;
    if (orderHotelId) {
      try {
        const resolved = await getHotelGoogleReviewUrl(orderHotelId);
        if (resolved) googleReviewUrl = resolved;
      } catch (e: any) {
        console.error('[public/orders/[id]] review URL lookup failed', { orderId: order.id, orderHotelId, message: e?.message });
      }
    }

    const hotelTheme =
      (order as any).hotels?.menu_theme ||
      (await getStoredMenuTheme((order as any).hotels?.id)) ||
      DEFAULT_MENU_THEME;
    const hotelCustomThemeConfig =
      (order as any).hotels?.custom_theme_config ||
      (hotelTheme === 'custom'
        ? await getStoredCustomTheme((order as any).hotels?.id || orderHotelId)
        : null) ||
      null;

    // Resolve billing group: this order + linked orders (water ↔ food) for combined customer bill
    const linkedOrderIds = new Set<string>();
    if (order.linked_order_id) linkedOrderIds.add(order.linked_order_id);

    const { data: linkedOrdersRaw } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, payment_status, status, table_number, created_at')
      .eq('linked_order_id', order.id);

    (linkedOrdersRaw || []).forEach((o: any) => linkedOrderIds.add(o.id));

    const allOrderIds = [order.id, ...Array.from(linkedOrderIds)];

    // Fetch payments across the billing group
    let totalPaid = 0;
    let combinedBillTotal = Number(order.total_amount || 0);
    try {
      const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('id, total_amount')
        .in('id', allOrderIds);

      combinedBillTotal = (allOrders || []).reduce(
        (sum, o) => sum + Number(o.total_amount || 0),
        0
      );

      const { data: payments } = await supabaseAdmin
        .from('order_payments')
        .select('amount, status')
        .in('order_id', allOrderIds)
        .eq('status', 'successful');

      if (payments && payments.length > 0) {
        totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      }
    } catch {}

    const remainingBalance = Math.max(0, Math.round((combinedBillTotal - totalPaid) * 100) / 100);

    // Fetch items from linked orders (e.g. water order items) for combined customer bill view
    let linkedOrdersWithItems: any[] = [];
    let combinedItems = [...items];
    if (linkedOrderIds.size > 1) {
      try {
        const { data: linkedOrdersWithItemsRaw } = await supabaseAdmin
          .from('orders')
          .select(`id, total_amount, status, payment_status, table_number, created_at, order_items (${itemSelectColumns.join(', ')})`)
          .in('id', Array.from(linkedOrderIds).filter((id) => id !== order.id));

        linkedOrdersWithItems = (linkedOrdersWithItemsRaw || []).map((lo: any) => {
          const loItems = ((lo as any).order_items || []).map((item: any) => {
            const resolved = resolveItemProperties(item, (lo as any).notes);
            return {
              id: item.id,
              order_id: lo.id,
              name: resolved.name,
              quantity: resolved.quantity,
              price_at_time: resolved.price_at_time,
              line_total: resolved.price_at_time * resolved.quantity,
              notes: resolved.notes,
              item_kind: resolved.item_kind,
              // Size fields
              size_id: item.size_id || null,
              size_name: item.size_name || null,
              size_price: item.size_price !== undefined ? Number(item.size_price) : null,
              ...(itemSchema.status ? { status: item.status ?? 'active' } : {}),
            };
          });
          combinedItems = [...combinedItems, ...loItems];
          return {
            id: lo.id,
            table_number: lo.table_number,
            total_amount: lo.total_amount,
            payment_status: lo.payment_status,
            status: lo.status,
            created_at: lo.created_at,
            items: loItems,
          };
        });
      } catch {}
    }

    // Water charges: water items on this order + water items on linked water orders
    const waterItemsOnOrder = items.filter((item: any) => isWaterItem(item));
    let waterCharges = waterItemsOnOrder.reduce((sum: number, item: any) => sum + Number(item.line_total || 0), 0);
    (linkedOrdersWithItems || []).forEach((lo: any) => {
      (lo.items || []).forEach((item: any) => {
        if (isWaterItem(item)) {
          waterCharges += Number(item.line_total || 0);
        }
      });
    });

    // Main `items` array: food items only — water products are excluded from display
    const foodItems = items.filter((item: any) => !isWaterItem(item));

    return new NextResponse(JSON.stringify({
      success: true,
      order: {
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
        linked_orders: linkedOrdersWithItems,
        combined_items: combinedItems,
        combined_bill_total: combinedBillTotal,
        created_at: order.created_at,
        ...(schema.updatedAt ? { updated_at: (order as any).updated_at } : {}),
        items: foodItems,
        hotel_theme: hotelTheme,
        hotel_custom_theme_config: hotelCustomThemeConfig,
        hotel_slug: orderHotelSlug,
        google_review_url: googleReviewUrl,
        currency: normalizeCurrency((order as any).hotels?.currency || null),
      },
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
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to fetch order' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
