// app/api/public/orders/[id]/route.ts
// Guest-facing read model behind /order/[orderId].
//
// A diner has no session, so this is the only way their order can be
// followed after checkout. The route accepts EITHER the permanent
// reference number (DINE-XXXXX, only present once migration 008 has
// been applied) or the raw uuid the create route navigates with --
// the customer is navigated straight from "Place Order" with the
// order's permanent id. Only the columns a guest may see are
// selected: the restaurant id, the guest's phone number and internal
// notes are omitted.
//
// The select list is built from the deployed schema
// (lib/ordersSchema): orders.updated_at and orders.order_number
// only exist once migrations 007/008 have been run in the Supabase
// SQL Editor, and selecting a column that does not exist makes
// Postgres fail the whole query (42703), which is what previously
// broke this page entirely.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import { getHotelSchema } from '@/lib/hotelSchema';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { normalizeCurrency } from '@/lib/menu';
import { orderReference } from '@/lib/orderReference';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

// This endpoint is polled every 2 seconds by the customer
// tracking page to follow a live order. It must never be
// statically rendered or cached: every poll reads the
// current database row.
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

    // A stored DINE-<digits> reference is resolved against
    // orders.order_number (indexed, unique). Anything else is the
    // order's permanent uuid and is resolved against orders.id.
    const column = schema.orderNumber && isStoredReferenceNumber(orderId)
      ? 'order_number'
      : 'id';

    // The select list is assembled from the detected schema, so its
    // shape cannot be inferred statically; the row is read as untyped
    // data below.
    const hotelSelect = [
      'id',
      hotelSchema.menuTheme ? 'menu_theme' : '',
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

    // order_items cancellation columns only exist once migration 017
    // has been applied. Selecting a missing column makes Postgres fail
    // the whole query (42703), so they are added only when present.
    const itemSelectColumns = [
      'id',
      'menu_item_id',
      'quantity',
      'price_at_time',
      'notes',
      ...(itemSchema.status ? ['status'] : []),
      ...(itemSchema.cancelledAt ? ['cancelled_at'] : []),
      ...(itemSchema.cancellationReason ? ['cancellation_reason'] : []),
      ...(itemSchema.cancelledBy ? ['cancelled_by'] : []),
      'menu_items (name)',
    ];

    // The select list is assembled from the detected schema, so
    // its shape cannot be inferred statically; the row is read
    // as untyped data below.
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

    // Transform order_items to have menu_item (singular) with name for frontend compatibility.
    // Cancellation fields are passed through only when the deployed schema has them.
    const items = ((order as any).order_items || []).map((item: any) => ({
      id: item.id,
      name: item.menu_items?.name || null,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      notes: item.notes,
      ...(itemSchema.status ? { status: item.status ?? 'active' } : {}),
      ...(itemSchema.cancelledAt ? { cancelled_at: item.cancelled_at ?? null } : {}),
      ...(itemSchema.cancellationReason ? { cancellation_reason: item.cancellation_reason ?? null } : {}),
      ...(itemSchema.cancelledBy ? { cancelled_by: item.cancelled_by ?? null } : {}),
    }));

    // The reference shown to the customer: the stored order_number
    // when the database has one, otherwise the stable code derived
    // from this row's id. It is computed from the stored row, so it
    // is identical on every refresh.
    const reference = orderReference(order as { id: string; order_number?: string | null });

    // ------------------------------------------------------------------
    // Resolve the hotel's Google Review URL explicitly from the order's
    // own `hotel_id` relationship, rather than trusting the PostgREST
    // `hotels (...)` join. The join depends on a schema probe and on
    // PostgREST detecting the FK; an explicit fetch by the order's own
    // hotel_id is deterministic and always uses the exact hotel the
    // order was placed with. The service-role client bypasses RLS, so
    // the public guest page never needs the anon key to read it.
    // ------------------------------------------------------------------
    let googleReviewUrl: string | null = (order as any).hotels?.google_review_url || null;
    const orderHotelId = (order as any).hotel_id || (order as any).hotels?.id || null;
    if (orderHotelId) {
      try {
        const { data: hotelRow, error: hotelErr } = await supabaseAdmin
          .from('hotels')
          .select('google_review_url')
          .eq('id', orderHotelId)
          .maybeSingle();
        if (hotelErr) {
          // Missing column on older deployments: keep join/fallback value.
          if (!['42703', 'PGRST204', 'PGRST205'].includes(hotelErr.code || '')) {
            console.error('[public/orders/[id]] hotel review URL lookup failed:', hotelErr.message);
          }
        } else if (hotelRow) {
          const direct = (hotelRow as any).google_review_url;
          if (typeof direct === 'string' && direct.trim()) googleReviewUrl = direct;
          else if (direct === null) googleReviewUrl = null;
        }
      } catch {
        // Fall back to the join value if the explicit probe fails.
      }
    }

    return new NextResponse(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: reference,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        table_number: order.table_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        notes: order.notes,
        total_amount: order.total_amount,
        created_at: order.created_at,
        ...(schema.updatedAt ? { updated_at: (order as any).updated_at } : {}),
        items,
        hotel_theme: (order as any).hotels?.menu_theme || await getStoredMenuTheme((order as any).hotels?.id) || DEFAULT_MENU_THEME,
        hotel_slug: (order as any).hotels?.slug || null,
        google_review_url: googleReviewUrl,
        // Normalise the stored currency to INR for display. This is a
        // DISPLAY-ONLY mapping: numeric prices, tax, service charge,
        // payment amounts and historical order rows are never altered.
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
