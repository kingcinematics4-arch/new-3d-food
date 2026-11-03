import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

function isStoredReferenceNumber(value: string): boolean {
  return /^DINE-\d+$/i.test(value);
}

const schema = z.object({
  order_id: z.string().min(1),
  order_item_id: z.string().min(1),
  reason: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from(table).select(column).limit(1);
    if (!error) return true;
    if (error.code && ['42703', 'PGRST204', 'PGRST205'].includes(error.code)) return false;
    return false;
  } catch { return false; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    const lookupColumn = isStoredReferenceNumber(validated.order_id) ? 'order_number' : 'id';
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq(lookupColumn, validated.order_id)
      .single();
    if (orderError || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const orderId = order.id;
    const status = (order.status || '').trim().toLowerCase();
    if (status === 'cancelled') {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order already cancelled' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (!['pending', 'accepted'].includes(status)) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Item cannot be cancelled at this stage' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const { data: item, error: itemError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, status')
      .eq('id', validated.order_item_id)
      .eq('order_id', orderId)
      .single();
    if (itemError || !item) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order item not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if ((item.status || '').toLowerCase() === 'cancelled') {
      return new NextResponse(JSON.stringify({ success: false, error: 'Item already cancelled' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const updatePayload: Record<string, any> = { status: 'cancelled' };
    if (await columnExists('order_items', 'cancelled_at')) updatePayload.cancelled_at = new Date().toISOString();
    const reasonText = validated.reason || validated.note || undefined;
    if (await columnExists('order_items', 'cancellation_reason')) {
      updatePayload.cancellation_reason = reasonText && String(reasonText).trim() ? String(reasonText).trim() : null;
    }
    if (await columnExists('order_items', 'cancelled_by')) updatePayload.cancelled_by = 'customer';

    const { error: updErr } = await supabaseAdmin.from('order_items').update(updatePayload).eq('id', validated.order_item_id).eq('order_id', orderId);
    if (updErr) throw updErr;

    const { data: allItems } = await supabaseAdmin.from('order_items').select('id, status').eq('order_id', orderId);
    const items = allItems || [];
    if (items.length > 0 && items.every((it: any) => (it.status || '').toLowerCase() === 'cancelled')) {
      const cancelPayload: Record<string, any> = { status: 'cancelled' };
      if (await columnExists('orders', 'cancellation_source')) cancelPayload.cancellation_source = 'customer';
      if (await columnExists('orders', 'cancelled_by')) cancelPayload.cancelled_by = 'customer';
      if (await columnExists('orders', 'cancelled_at')) cancelPayload.cancelled_at = new Date().toISOString();
      if (await columnExists('orders', 'cancellation_reason')) {
        cancelPayload.cancellation_reason = reasonText && String(reasonText).trim() ? String(reasonText).trim() : null;
      }
      await supabaseAdmin.from('orders').update(cancelPayload).eq('id', orderId);
    }

    await supabaseAdmin.from('order_status_history').insert({ order_id: orderId, status: 'item_cancelled', note: 'Item ' + validated.order_item_id + ' cancelled by customer' });

    return new NextResponse(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to cancel item' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
