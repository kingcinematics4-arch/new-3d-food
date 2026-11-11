// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema, getOrderItemsSchema } from '@/lib/ordersSchema';
import {
  resolveItemProperties,
  parseWaterFromNotes,
  cleanWaterNotes,
  isWaterOrder,
  isWaterItem,
} from '@/lib/waterOrderHelper';

const TZ = 'Asia/Kolkata';

function currentMonthRangeIST() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value || '1970';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const nextY = m === '12' ? String(Number(y) + 1) : y;
  const nextM = m === '12' ? '01' : String(Number(m) + 1).padStart(2, '0');
  // IST month boundaries as UTC instants (+05:30)
  return { from: `${y}-${m}-01T00:00:00+05:30`, to: `${nextY}-${nextM}-01T00:00:00+05:30` };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');
    const since = searchParams.get('since');
    const scope = searchParams.get('scope'); // 'month' (current IST month) | 'all'
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotel_id is required' },
        { status: 400 }
      );
    }

    // `order_number` and `updated_at` only exist once migrations
    // 008/007 have been applied to this deployment. They are never
    // listed explicitly here (`*` already covers them when present)
    // and the incremental `since` filter is skipped when the
    // updated_at column has not been created, because selecting a
    // missing column fails the whole query (42703).
    const schema = await getOrdersSchema();
    const itemSchema = await getOrderItemsSchema().catch(() => ({ itemName: false, status: false, cancelledAt: false, cancellationReason: false, cancelledBy: false, itemKind: false } as any));

    const itemCols = [
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
      'menu_items ( name, price )',
    ].join(',\n          ');

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          ${itemCols}
        )
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    // Keep real-time status updates working: the previous `since+updated_at`
    // incremental path can exclude older-in-the-month orders whose status
    // changed (updated_at moves past `since` but created_at stays in-month).
    // For scope=month, return the full current IST month (bounded by hotel).
    // Pass scope=all + since for the legacy incremental behaviour if needed.
    if (fromParam) {
      query = query.gte('created_at', fromParam);
      if (toParam) query = query.lt('created_at', toParam);
    } else if (scope === 'month' || (!scope && !since)) {
      const { from, to } = currentMonthRangeIST();
      query = query.gte('created_at', from).lt('created_at', to);
    } else if (since && schema.updatedAt) {
      query = query.gte('updated_at', since);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    // Transform order_items to normalize water items, prices, and clean notes
    const transformedOrders = (orders || []).map((order: any) => {
      let items = (order.order_items || []).map((item: any) => {
        const resolved = resolveItemProperties(item, order.notes);
        return {
          ...item,
          price_at_time: resolved.price_at_time,
          price: resolved.price,
          name: resolved.name,
          quantity: resolved.quantity,
          item_kind: resolved.item_kind,
          notes: resolved.notes,
          menu_item: item.menu_items
            ? { name: item.menu_items.name, price: item.menu_items.price }
            : resolved.name
            ? { name: resolved.name, price: resolved.price }
            : null,
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
              order_id: order.id,
              menu_item_id: null,
              quantity: qty,
              price_at_time: unitPrice,
              price: unitPrice,
              name: waterFromNotes.name,
              item_kind: 'water',
              notes: null,
              status: 'active',
              menu_item: { name: waterFromNotes.name, price: unitPrice },
            },
          ];
        }
      }

      const isWater = isWaterOrder({ notes: order.notes, order_items: items });
      const cleanOrderNotes = isWater ? cleanWaterNotes(order.notes) : (order.notes || null);

      // Separate water items from food items — water items are NOT displayed
      // as food order items in the dashboard food card; they appear in the
      // separate Water Order card. Water charges are still included in the bill.
      const waterItems = items.filter((item: any) => isWaterItem(item));
      const foodItems = items.filter((item: any) => !isWaterItem(item));
      const waterCharges = waterItems.reduce((sum: number, item: any) => sum + Number(item.price_at_time || 0) * Number(item.quantity || 0), 0);

      return {
        ...order,
        notes: cleanOrderNotes,
        order_items: isWater ? items : foodItems, // water orders keep all items; food orders exclude water
        water_items: waterItems, // water items for the separate Water Order card
        water_charges: waterCharges, // paid water charges included in the bill total
        is_water_order: isWater,
      };
    });

    // Propagate delivered water charges from linked water orders to
    // parent food orders' water_charges field. This ensures the
    // ACTIVE ORDER TOTAL on the food card includes delivered water
    // charges from linked water orders.
    // Only delivered water orders are included; pending/cancelled are
    // excluded. Each delivered water order's charges are added exactly
    // once (computed at query time, so no idempotency concerns).
    // Two association paths:
    //   1. linked_order_id column (migration 030) — precise parent link
    //   2. hotel_id + table_number match — fallback for deployments
    //      where migration 030 has not yet been applied.
    const byId = new Map<string, any>();
    for (const o of transformedOrders) byId.set(o.id, o);

    const foodOrdersByTable = new Map<string, any[]>();
    for (const o of transformedOrders) {
      if (o.is_water_order) continue;
      foodOrdersByTable.set(
        `${o.hotel_id}|${o.table_number}`,
        [...(foodOrdersByTable.get(`${o.hotel_id}|${o.table_number}`) || []), o]
      );
    }

    for (const o of transformedOrders) {
      if (!o.is_water_order) continue;
      const statusLower = String(o.status || '').trim().toLowerCase();
      const waterDelivered = o.water_delivered === true || statusLower === 'delivered';
      if (!waterDelivered) continue;
      const waterTotal = Number(o.water_charges || 0);
      if (waterTotal <= 0) continue;

      let parent: any = null;

      // Path 1: precise linked_order_id reference
      if (schema.linkedOrderId && o.linked_order_id) {
        parent = byId.get(o.linked_order_id);
        if (!parent || parent.is_water_order) parent = null;
      }

      // Path 2: fallback by hotel_id + table_number (dine-in association)
      if (!parent && o.hotel_id && o.table_number) {
        const candidates = foodOrdersByTable.get(`${o.hotel_id}|${o.table_number}`) || [];
        // Pick the most recent non-cancelled food order for this table
        const activeFood = candidates.find(
          (p: any) => String(p.status || '').trim().toLowerCase() !== 'cancelled'
        );
        parent = activeFood || null;
      }

      if (parent) {
        parent.water_charges = Number(parent.water_charges || 0) + waterTotal;
      }
    }

    return new NextResponse(JSON.stringify({ success: true, orders: transformedOrders }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to fetch orders' }), {
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
