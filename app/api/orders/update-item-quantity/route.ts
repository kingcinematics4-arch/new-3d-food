import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

const schema = z.object({
  order_id: z.string().min(1),
  order_item_id: z.string().min(1),
  quantity: z.number().int().min(1),
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
      .select('id, status, hotel_id')
      .eq(lookupColumn, validated.order_id)
      .single();
    if (orderError || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const orderId = order.id;
    const status = (order.status || '').trim().toLowerCase();
    if (!['pending', 'accepted', 'placed'].includes(status)) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Quantity cannot be edited at this stage' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    try {
      const { error: rpcErr } = await supabaseAdmin.rpc('update_order_item_quantity_atomic', {
        p_order_id: orderId,
        p_order_item_id: validated.order_item_id,
        p_quantity: validated.quantity,
      });
      if (!rpcErr) {
        const itemSchemaHasStatus = await columnExists('order_items', 'status');
const itemSelect = itemSchemaHasStatus
      ? 'id, menu_item_id, quantity, price_at_time, notes, item_name, status, menu_items(name)'
      : 'id, menu_item_id, quantity, price_at_time, notes, item_name, menu_items(name)';
        const { data: fullOrder } = await supabaseAdmin
          .from('orders')
        .select(`id, status, payment_status, payment_method, table_number, customer_name, customer_phone, notes, total_amount, created_at, updated_at, order_number, order_items(${itemSelect})`)
          .eq('id', orderId)
          .single();
const items = ((fullOrder as any)?.order_items || []).map((it: any) => ({
          id: it.id,
          name: it.item_name || it.menu_items?.name || null,
          quantity: it.quantity,
          price_at_time: it.price_at_time,
          notes: it.notes,
          status: itemSchemaHasStatus ? (it.status ?? 'active') : 'active',
        }));
        const hotelTheme = await getHotelThemeForOrder(orderId);
        return new NextResponse(JSON.stringify({ success: true, order: { ...(fullOrder||{}), items, hotel_theme: hotelTheme || (fullOrder as any)?.hotel_theme } }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
    } catch (e) {
      // continue
    }

    const itemSchemaHasStatus = await columnExists('order_items', 'status');
    const { data: item, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select(itemSchemaHasStatus ? 'id, order_id, status, quantity, price_at_time' : 'id, order_id, quantity, price_at_time')
      .eq('id', validated.order_item_id)
      .eq('order_id', orderId)
      .single();
    if (itemError || !item) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order item not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (itemSchemaHasStatus && ((item as any).status || '').toLowerCase() === 'cancelled') {
      return new NextResponse(JSON.stringify({ success: false, error: 'Cannot edit cancelled item' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const { error: updErr } = await supabaseAdmin
      .from('order_items')
      .update({ quantity: validated.quantity })
      .eq('id', validated.order_item_id)
      .eq('order_id', orderId);
    if (updErr) throw updErr;

    const { data: allItems, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select(itemSchemaHasStatus ? 'quantity, price_at_time, status' : 'quantity, price_at_time')
      .eq('order_id', orderId);
    if (itemsErr) throw itemsErr;

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
    if (hasOrdersUpdatedAt) {
      updateOrdersPayload.updated_at = new Date().toISOString();
    }
    await supabaseAdmin
      .from('orders')
      .update(updateOrdersPayload)
      .eq('id', orderId);

    const itemSelect2 = itemSchemaHasStatus
      ? 'id, menu_item_id, quantity, price_at_time, notes, item_name, status, menu_items(name)'
      : 'id, menu_item_id, quantity, price_at_time, notes, item_name, menu_items(name)';
    const { data: fullOrder, error: fullErr } = await supabaseAdmin
      .from('orders')
      .select(`id, status, payment_status, payment_method, table_number, customer_name, customer_phone, notes, total_amount, created_at, updated_at, order_number, order_items(${itemSelect2})`)
      .eq('id', orderId)
      .single();
    if (fullErr) throw fullErr;

    const items = ((fullOrder as any)?.order_items || []).map((it: any) => ({
      id: it.id,
      name: it.item_name || it.menu_items?.name || null,
      quantity: it.quantity,
      price_at_time: it.price_at_time,
      notes: it.notes,
      status: itemSchemaHasStatus ? (it.status ?? 'active') : 'active',
    }));

    const hotelTheme = await getHotelThemeForOrder(orderId);
    return new NextResponse(JSON.stringify({ success: true, order: { ...(fullOrder||{}), items, hotel_theme: hotelTheme || (fullOrder as any)?.hotel_theme } }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to update quantity' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
