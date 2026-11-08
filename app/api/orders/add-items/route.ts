import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

const itemSchema = z.object({
  menu_item_id: z.string().min(1),
  quantity: z.number().int().positive(),
  notes: z.string().optional().nullable(),
  item_name: z.string().optional().nullable(),
  item_kind: z.string().optional().nullable(),
});

const schema = z.object({
  order_id: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from(table).select(column).limit(1);
    if (!error) return true;
    if (error.code && ['42703', 'PGRST204', 'PGRST205'].includes(error.code)) return false;
    return false;
  } catch {
    return false;
  }
}

async function getHotelThemeForOrder(orderId: string) {
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('hotels(id, menu_theme, slug)')
      .eq('id', orderId)
      .single();
    const hotel: any = (data as any)?.hotels;
    if (hotel?.menu_theme) return hotel.menu_theme;
    return undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const lookupColumn = isStoredReferenceNumber(validated.order_id) ? 'order_number' : 'id';
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, status')
      .eq(lookupColumn, validated.order_id)
      .single();
    if (orderError || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const orderId = order.id;
    const hotelId = order.hotel_id;
    const status = (order.status || '').trim().toLowerCase();
    if (!['pending', 'accepted', 'placed'].includes(status)) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Adding dishes is not available at this stage' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const menuItemIds = validated.items.map((i) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('menu_items')
      .select('id, hotel_id, price, is_available')
      .in('id', menuItemIds);
    if (menuError) throw menuError;

    const menuMap = new Map((menuItems || []).map((m: any) => [m.id, m]));
    const toInsert: any[] = [];
    for (const it of validated.items) {
      const mi: any = menuMap.get(it.menu_item_id);
      if (!mi) {
        return new NextResponse(JSON.stringify({ success: false, error: 'Menu item not found' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
      if (mi.hotel_id !== hotelId) {
        return new NextResponse(JSON.stringify({ success: false, error: 'Menu item does not belong to this restaurant' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
      if (mi.is_available === false) {
        return new NextResponse(JSON.stringify({ success: false, error: 'One or more items are not available' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
      const insertRow: any = {
        order_id: orderId,
        menu_item_id: it.menu_item_id,
        quantity: it.quantity,
        price_at_time: mi.price,
        notes: it.notes || null,
      };
      if (await columnExists('order_items', 'item_name')) {
        insertRow.item_name = it.item_name || null;
      }
      if (await columnExists('order_items', 'item_kind') && it.item_kind) {
        insertRow.item_kind = it.item_kind;
      }
      if (await columnExists('order_items', 'status')) {
        insertRow.status = 'active';
      }
      toInsert.push(insertRow);
    }

    const { error: insErr } = await supabaseAdmin.from('order_items').insert(toInsert);
    if (insErr) throw insErr;

    const itemSchemaHasStatus = await columnExists('order_items', 'status');
    const itemSchemaHasItemName = await columnExists('order_items', 'item_name');
    const itemSchemaHasItemKind = await columnExists('order_items', 'item_kind');
    const { data: allItems } = await supabaseAdmin
      .from('order_items')
      .select(itemSchemaHasStatus ? 'quantity, price_at_time, status' : 'quantity, price_at_time')
      .eq('order_id', orderId);
    let activeTotal = 0;
    for (const it of allItems || []) {
      const isCancelled = itemSchemaHasStatus && ((it as any).status || '').toLowerCase() === 'cancelled';
      if (isCancelled) continue;
      const qty = Number((it as any).quantity || 0);
      const price = Number((it as any).price_at_time || 0);
      activeTotal += qty * price;
    }
    const hasOrdersUpdatedAt = await columnExists('orders', 'updated_at');
    const updateOrdersPayload: Record<string, any> = { total_amount: activeTotal };
    if (hasOrdersUpdatedAt) updateOrdersPayload.updated_at = new Date().toISOString();
    await supabaseAdmin.from('orders').update(updateOrdersPayload).eq('id', orderId);

    try {
      await supabaseAdmin.from('order_status_history').insert({ order_id: orderId, status: status === 'accepted' ? 'accepted' : 'pending', note: 'Items added to order by customer' });
    } catch {}

    const itemSelect = [
      'id', 'menu_item_id', 'quantity', 'price_at_time', 'notes',
      ...(itemSchemaHasItemName ? ['item_name'] : []),
      ...(itemSchemaHasItemKind ? ['item_kind'] : []),
      ...(itemSchemaHasStatus ? ['status'] : []),
      'menu_items(name)',
    ].join(', ');
    const { data: fullOrder, error: fullErr } = await supabaseAdmin
      .from('orders')
      .select(`id, status, payment_status, payment_method, table_number, customer_name, customer_phone, notes, total_amount, created_at, updated_at, order_number, order_items(${itemSelect})`)
      .eq('id', orderId)
      .single();
    if (fullErr) throw fullErr;

    const itemsOut = ((fullOrder as any)?.order_items || []).map((it: any) => ({
      id: it.id,
      name: (itemSchemaHasItemName ? it.item_name : null) || it.menu_items?.name || null,
      quantity: it.quantity,
      price_at_time: it.price_at_time,
      notes: it.notes,
      item_kind: itemSchemaHasItemKind ? (it.item_kind ?? null) : null,
      status: itemSchemaHasStatus ? (it.status ?? 'active') : 'active',
    }));
    const hotelTheme = await getHotelThemeForOrder(orderId);
    return new NextResponse(JSON.stringify({ success: true, order: { ...((fullOrder as Record<string, any>) || {}), items: itemsOut, hotel_theme: hotelTheme || (fullOrder as any)?.hotel_theme } }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to add items' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
