// app/api/public/orders/[id]/route.ts
// Guest-facing read model behind /order/[orderId].

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import { getHotelSchema } from '@/lib/hotelSchema';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { normalizeCurrency } from '@/lib/menu';
import { orderReference } from '@/lib/orderReference';
import { getHotelGoogleReviewUrl, getStoredCustomTheme } from '@/lib/customThemeStore.server';

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

    const items = ((order as any).order_items || []).map((item: any) => {
      const priceAtTime = item.price_at_time ?? 0;
      return {
        id: item.id,
        name: item.item_name || item.menu_items?.name || null,
        quantity: Number(item.quantity) || 0,
        price_at_time: priceAtTime,
        line_total: Number(priceAtTime) * (Number(item.quantity) || 0),
        notes: item.notes ?? null,
        item_kind: item.item_kind ?? null,
        ...(itemSchema.status ? { status: item.status ?? 'active' } : {}),
        ...(itemSchema.cancelledAt ? { cancelled_at: item.cancelled_at ?? null } : {}),
        ...(itemSchema.cancellationReason ? { cancellation_reason: item.cancellation_reason ?? null } : {}),
        ...(itemSchema.cancelledBy ? { cancelled_by: item.cancelled_by ?? null } : {}),
      };
    });

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

    // Fetch payments for this order to provide real-time split billing status
    let totalPaid = 0;
    try {
      const { data: payments } = await supabaseAdmin
        .from('order_payments')
        .select('amount, status')
        .eq('order_id', order.id)
        .eq('status', 'successful');

      if (payments && payments.length > 0) {
        totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      }
    } catch {}

    const billTotal = Number(order.total_amount || 0);
    const remainingBalance = Math.max(0, Math.round((billTotal - totalPaid) * 100) / 100);

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
        notes: order.notes,
        total_amount: order.total_amount,
        amount_paid: totalPaid,
        remaining_balance: remainingBalance,
        created_at: order.created_at,
        ...(schema.updatedAt ? { updated_at: (order as any).updated_at } : {}),
        items,
        hotel_theme: hotelTheme,
        hotel_custom_theme_config: hotelCustomThemeConfig,
        hotel_slug: (order as any).hotels?.slug || null,
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
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to load this order' }), {
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
