import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { orderReference } from '@/lib/orderReference';
import { getOrderItemsSchema, getOrdersSchema } from '@/lib/ordersSchema';
import { isWaterItem, isWaterOrder, cleanWaterNotes, WATER_NAME_PATTERN } from '@/lib/waterOrderHelper';
import { z } from 'zod';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const createOrderSchema = z.object({
  hotel_id: z.string().min(1, 'hotel_id is required'),
  table_number: z.string().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  order_type: z.enum(['dine_in', 'takeaway']).default('dine_in'),
  payment_method: z.enum(['pay_at_table', 'card', 'upi']).default('pay_at_table'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      menu_item_id: z.string().min(1).nullable().optional(),
      quantity: z.number().int().positive(),
      price_at_time: z.number().nonnegative(),
      notes: z.string().optional().nullable(),
      item_name: z.string().optional().nullable(),
      item_kind: z.string().optional().nullable(),
      // Size options
      size_id: z.string().uuid().nullable().optional(),
      size_name: z.string().optional().nullable(),
      // `null` is accepted for backwards compatibility with older cached
      // clients: a normal (no-size) dish omits this field, and a stale bundle
      // may still send `null`. Rejecting null made the whole order fail.
      size_price: z.number().nonnegative().nullish(),
    })
  ).min(1, 'Order must contain at least one item'),
});

type ValidatedItems = z.infer<typeof createOrderSchema>['items'];
type ItemSchema = Awaited<ReturnType<typeof getOrderItemsSchema>>;

function buildOrderItemRows(
  orderId: string,
  items: ValidatedItems,
  itemSchema: ItemSchema
): Record<string, any>[] {
  return items.map((item) => {
    const rawId = typeof item.menu_item_id === 'string' ? item.menu_item_id.trim() : '';
    const menuItemId = rawId && isUuid(rawId) ? rawId : null;
    const isWater = item.item_kind === 'water' || (!menuItemId && !!item.item_name && WATER_NAME_PATTERN.test(item.item_name));
    const kind = isWater ? 'water' : (item.item_kind || null);
    const name = item.item_name || (isWater ? 'Free Water' : null);

    // Embed water metadata tag in notes if DB column item_name/item_kind is not yet deployed
    let finalNotes = item.notes ? cleanWaterNotes(item.notes) : null;
    if (isWater && name) {
      const tag = `[water_item:{"name":${JSON.stringify(name)},"kind":"water"}]`;
      finalNotes = finalNotes ? `${tag} ${finalNotes}` : tag;
    }

    const row: Record<string, any> = {
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      notes: finalNotes,
    };
    if (itemSchema.itemName) row.item_name = name;
    if (itemSchema.itemKind && kind) row.item_kind = kind;
    if (itemSchema.status) row.status = 'active';
    // Size fields
    if (itemSchema.sizeId && item.size_id && isUuid(item.size_id)) row.size_id = item.size_id;
    if (itemSchema.sizeName && item.size_name) row.size_name = item.size_name;
    if (itemSchema.sizePrice && item.size_price !== undefined && item.size_price !== null && Number.isFinite(item.size_price)) row.size_price = item.size_price;
    return row;
  });
}

async function recalculateOrderTotal(orderId: string, itemSchema: ItemSchema): Promise<number> {
  const cols = ['quantity', 'price_at_time', ...(itemSchema.status ? ['status'] : [])].join(', ');
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select(cols)
    .eq('order_id', orderId);
  if (error) throw new Error(`Order total recalculation failed: ${error.message}`);

  let total = 0;
  for (const it of data || []) {
    const row = it as any;
    if (itemSchema.status && String(row.status || '').toLowerCase() === 'cancelled') continue;
    total += Number(row.quantity || 0) * Number(row.price_at_time || 0);
  }
  return total;
}

interface ActiveOrderRow {
  id: string;
  hotel_id: string;
  table_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_number?: string | null;
  updated_at?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    const itemSchema = await getOrderItemsSchema().catch(() => ({ itemName: false, itemKind: false, status: false } as any));
    const ordersSchema = await getOrdersSchema().catch(() => ({ orderNumber: false, updatedAt: false, linkedOrderId: false } as any));

    // ── Active order recovery ──
    // Before creating a new order, check if there's already an active unpaid order
    // for this hotel+table. Active = payment_status != 'paid' AND status != 'cancelled'.
    // This prevents duplicate orders when a customer re-scans the QR code or
    // refreshes the page. Water-only orders are excluded from this check because
    // they are separate records linked to a parent food order.
    const tableNumber = validated.table_number || 'Takeaway';

    // Determine whether every item is a water item (free or paid bottled water)
    const allItemsWater = validated.items.every(
      (it) => isWaterItem(it) || (it.item_name && WATER_NAME_PATTERN.test(it.item_name))
    );

    if (tableNumber && !allItemsWater) {
      const { data: existingOrder, error: existingError } = await supabaseAdmin
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
          ...(ordersSchema.orderNumber ? ['order_number'] : []),
          ...(ordersSchema.updatedAt ? ['updated_at'] : []),
        ].join(', '))
        .eq('hotel_id', validated.hotel_id)
        .eq('table_number', tableNumber)
        .neq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<ActiveOrderRow>();

      if (!existingError && existingOrder) {
        // Append the incoming cart to the existing active order instead of
        // silently dropping it. Previously this branch returned the old order
        // without inserting the new items, so a guest who re-opened the menu
        // or re-scanned the QR for a table that already had an open order saw
        // only the earlier single item in Live Orders.
        const newRows = buildOrderItemRows(existingOrder.id, validated.items, itemSchema);

        // Merge exact duplicates into the existing active line instead of
        // creating a second row for the same dish/size/price/note. This keeps
        // Live Orders and the bill readable while still preserving every unit.
        const existingCols = [
          'id',
          'menu_item_id',
          'quantity',
          'price_at_time',
          'notes',
          ...(itemSchema.sizeId ? ['size_id'] : []),
          ...(itemSchema.status ? ['status'] : []),
        ].join(', ');
        const { data: existingItemsData, error: existingItemsError } = await supabaseAdmin
          .from('order_items')
          .select(existingCols)
          .eq('order_id', existingOrder.id);
        if (existingItemsError) throw new Error(`Order items read failed: ${existingItemsError.message}`);
        const existingItems = (existingItemsData || []) as any[];

        const rowsToInsert: Record<string, any>[] = [];
        for (const row of newRows) {
          const match = row.menu_item_id
            ? (existingItems || []).find((it: any) => {
                if (itemSchema.status && String(it.status || '').toLowerCase() === 'cancelled') return false;
                if (it.menu_item_id !== row.menu_item_id) return false;
                const existingSize = itemSchema.sizeId ? (it.size_id || null) : null;
                const newSize = itemSchema.sizeId ? (row.size_id || null) : null;
                if (existingSize !== newSize) return false;
                if (Number(it.price_at_time || 0) !== Number(row.price_at_time || 0)) return false;
                if ((it.notes || null) !== (row.notes || null)) return false;
                return true;
              })
            : undefined;

          if (match) {
            const mergedQty = Number(match.quantity || 0) + Number(row.quantity || 0);
            const { error: qtyError } = await supabaseAdmin
              .from('order_items')
              .update({ quantity: mergedQty })
              .eq('id', match.id);
            if (qtyError) throw new Error(`Order item quantity update failed: ${qtyError.message}`);
            match.quantity = mergedQty;
          } else {
            rowsToInsert.push(row);
          }
        }

        if (rowsToInsert.length > 0) {
          const { error: addItemsError } = await supabaseAdmin
            .from('order_items')
            .insert(rowsToInsert);
          if (addItemsError) throw new Error(`Order items insertion failed: ${addItemsError.message}`);
        }

        const recalculatedTotal = await recalculateOrderTotal(existingOrder.id, itemSchema);
        const updatePayload: Record<string, any> = { total_amount: recalculatedTotal };
        if (ordersSchema.updatedAt) updatePayload.updated_at = new Date().toISOString();
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', existingOrder.id);
        if (updateError) throw new Error(`Order total update failed: ${updateError.message}`);

        try {
          await supabaseAdmin.from('order_status_history').insert({
            order_id: existingOrder.id,
            status: existingOrder.status || 'pending',
            note: 'Additional items received from customer',
          });
        } catch {}

        const storedOrderNumber: string | null = (existingOrder as any).order_number || null;
        const reference: string = orderReference({ id: existingOrder.id, order_number: storedOrderNumber });
        return NextResponse.json(
          {
            success: true,
            orderId: existingOrder.id,
            orderNumber: reference,
            orderCode: reference,
            order: {
              ...(existingOrder as any),
              total_amount: recalculatedTotal,
              order_number: storedOrderNumber || reference,
            },
            recovered: true,
            itemsAdded: true,
          },
          { status: 200 }
        );
      }
    }

    // Calculate total amount
    // Water orders: charges are deferred until delivery (MARK AS DELIVERED).
    // The water order starts with total_amount = 0; the RPC deliver_water_order
    // adds the water total to the parent food order's combined bill on delivery.
    const totalAmount = allItemsWater ? 0 : validated.items.reduce(
      (sum, item) => sum + item.price_at_time * item.quantity,
      0
    );

    // Sanitize order notes: never store water product information in order-level notes
    const hasOnlyWater = validated.items.every(
      (it) => it.item_kind === 'water' || (it.item_name && WATER_NAME_PATTERN.test(it.item_name))
    );
    const cleanNotes = validated.notes ? cleanWaterNotes(validated.notes) : null;
    const finalOrderNotes = hasOnlyWater ? (cleanNotes || null) : (validated.notes || null);

    // ── Water billing integration ──
    // Water orders are separate order records (separate cards in Live Orders).
    // When paid water is ordered for a table that has an existing open food order,
    // link the water order to that food order via linked_order_id so billing can
    // combine food + water into one customer bill. Free water (₹0) is always
    // a standalone record and never changes any bill total.
    let linkedOrderId: string | null = null;

    if (allItemsWater && validated.table_number) {
      const { data: existingOrders } = await supabaseAdmin
        .from('orders')
        .select('id, hotel_id, table_number, status, total_amount')
        .eq('hotel_id', validated.hotel_id)
        .eq('table_number', validated.table_number)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1);

      const existingOrder = (existingOrders || [])[0];
      if (existingOrder) {
        linkedOrderId = existingOrder.id;
      }
    }

    // 1. Insert Order
    const insertPayload: Record<string, any> = {
      hotel_id: validated.hotel_id,
      table_number: validated.table_number || 'Takeaway',
      customer_name: validated.customer_name || 'Guest',
      customer_phone: validated.customer_phone,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'unpaid',
      payment_method: validated.payment_method,
      notes: finalOrderNotes,
    };
    // Only include linked_order_id if the column exists in the deployed schema
    // (migration 030). Water orders link to their parent food order for combined
    // billing. If the column doesn't exist yet, the water order is still created
    // as a standalone record - linking will work once migration 030 is applied.
    if (ordersSchema.linkedOrderId && linkedOrderId) {
      insertPayload.linked_order_id = linkedOrderId;
    }

    const { data: newOrderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(insertPayload)
      .select()
      .single();

    if (orderError) throw new Error(`Order insertion failed: ${orderError.message}`);

    // The permanent reference shown to the customer
    const storedOrderNumber: string | null = (newOrderData as any).order_number || null;
    const reference: string = orderReference({ id: newOrderData.id, order_number: storedOrderNumber });

    // 2. Insert Order Items
    const orderItemsToInsert = buildOrderItemRows(newOrderData.id, validated.items, itemSchema);

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw new Error(`Order items insertion failed: ${itemsError.message}`);

    // 3. Log initial order status in history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: newOrderData.id,
      status: 'pending',
      note: isWaterOrder({ notes: finalOrderNotes, order_items: validated.items })
        ? 'Water request received'
        : 'Order submitted by customer',
    });

    return NextResponse.json(
      {
        success: true,
        orderId: newOrderData.id,
        orderNumber: reference,
        orderCode: reference,
        order: { ...newOrderData, order_number: storedOrderNumber || reference },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to place order',
      },
      { status: 400 }
    );
  }
}
