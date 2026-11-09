import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { orderReference } from '@/lib/orderReference';
import { getOrderItemsSchema } from '@/lib/ordersSchema';
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
      price_at_time: z.number().nonnegative(), // allows 0 for free items like Free Water
      notes: z.string().optional().nullable(),
      item_name: z.string().optional().nullable(),
      item_kind: z.string().optional().nullable(), // e.g. 'water' (migration 028)
    })
  ).min(1, 'Order must contain at least one item'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    const itemSchema = await getOrderItemsSchema().catch(() => ({ itemName: false, itemKind: false, status: false } as any));

    // Calculate total amount
    const totalAmount = validated.items.reduce(
      (sum, item) => sum + item.price_at_time * item.quantity,
      0
    );

    // Sanitize order notes: never store water product information in order-level notes
    const hasOnlyWater = validated.items.every(
      (it) => it.item_kind === 'water' || (it.item_name && WATER_NAME_PATTERN.test(it.item_name))
    );
    const cleanNotes = validated.notes ? cleanWaterNotes(validated.notes) : null;
    const finalOrderNotes = hasOnlyWater ? (cleanNotes || null) : (validated.notes || null);

    // Determine whether every item is a water item (free or paid bottled water)
    const allItemsWater = validated.items.every(
      (it) => isWaterItem(it) || (it.item_name && WATER_NAME_PATTERN.test(it.item_name))
    );

    // ── Water billing integration ──
    // Paid water must be added to the customer's existing restaurant bill for the
    // same table (one grand total: food + paid water). Free water (₹0) never
    // changes the bill total. When no open order exists for the table, create a
    // new order as before.
    if (allItemsWater && validated.table_number) {
      // Look for an existing open (non-terminal) order for this hotel + table.
      const { data: existingOrders } = await supabaseAdmin
        .from('orders')
        .select('id, hotel_id, table_number, status, payment_status, total_amount')
        .eq('hotel_id', validated.hotel_id)
        .eq('table_number', validated.table_number)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1);

      const existingOrder = (existingOrders || [])[0];

      if (existingOrder) {
        // Add water items to the existing order.
        const orderItemsToInsert = validated.items.map((item) => {
          const rawId = typeof item.menu_item_id === 'string' ? item.menu_item_id.trim() : '';
          const menuItemId = rawId && isUuid(rawId) ? rawId : null;
          const isWater = item.item_kind === 'water' || (!menuItemId && !!item.item_name && WATER_NAME_PATTERN.test(item.item_name));
          const kind = isWater ? 'water' : (item.item_kind || null);
          const name = item.item_name || (isWater ? 'Free Water' : null);

          let finalNotes = item.notes ? cleanWaterNotes(item.notes) : null;
          if (isWater && name) {
            const tag = `[water_item:{"name":${JSON.stringify(name)},"kind":"water"}]`;
            finalNotes = finalNotes ? `${tag} ${finalNotes}` : tag;
          }

          const row: Record<string, any> = {
            order_id: existingOrder.id,
            menu_item_id: menuItemId,
            quantity: item.quantity,
            price_at_time: item.price_at_time,
            notes: finalNotes,
          };
          if (itemSchema.itemName) row.item_name = name;
          if (itemSchema.itemKind && kind) row.item_kind = kind;
          return row;
        });

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) throw new Error(`Order items insertion failed: ${itemsError.message}`);

        // Recalculate order total: existing total + newly added water items.
        const addedWaterTotal = validated.items.reduce(
          (sum, item) => sum + item.price_at_time * item.quantity,
          0
        );
        const newTotalAmount = Math.round((Number(existingOrder.total_amount || 0) + addedWaterTotal) * 100) / 100;

        const now = new Date().toISOString();
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            total_amount: newTotalAmount,
            updated_at: now,
          })
          .eq('id', existingOrder.id)
          .select()
          .single();

        if (updateError) throw new Error(`Order update failed: ${updateError.message}`);

        const storedOrderNumber = (updatedOrder as any).order_number || null;
        const reference = orderReference({ id: updatedOrder.id, order_number: storedOrderNumber });

        // Log water addition to history
        await supabaseAdmin.from('order_status_history').insert({
          order_id: updatedOrder.id,
          status: existingOrder.status,
          note: 'Paid water added to table bill',
        });

        return NextResponse.json(
          {
            success: true,
            orderId: updatedOrder.id,
            orderNumber: reference,
            orderCode: reference,
            addedToExistingOrder: true,
            order: { ...updatedOrder, order_number: storedOrderNumber || reference },
          },
          { status: 200 }
        );
      }
    }

    // 1. Insert Order (no existing open order, or not all-water, or no table number)
    const { data: newOrderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        hotel_id: validated.hotel_id,
        table_number: validated.table_number || 'Takeaway',
        customer_name: validated.customer_name || 'Guest',
        customer_phone: validated.customer_phone,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: validated.payment_method,
        notes: finalOrderNotes,
      })
      .select()
      .single();

    if (orderError) throw new Error(`Order insertion failed: ${orderError.message}`);

    // The permanent reference shown to the customer
    const storedOrderNumber: string | null = (newOrderData as any).order_number || null;
    const reference: string = orderReference({ id: newOrderData.id, order_number: storedOrderNumber });

    // 2. Insert Order Items
    const orderItemsToInsert = validated.items.map((item) => {
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
        order_id: newOrderData.id,
        menu_item_id: menuItemId,
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        notes: finalNotes,
      };
      if (itemSchema.itemName) row.item_name = name;
      if (itemSchema.itemKind && kind) row.item_kind = kind;
      return row;
    });

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
