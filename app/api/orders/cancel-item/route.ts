import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

const cancelItemSchema = z.object({
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
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = cancelItemSchema.parse(body);

    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return new NextResponse(JSON.stringify({ success: false, error: access.error }), { status: access.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('id, hotel_id, status').eq('id', validated.order_id).single();
    if (orderError || !order) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (order.hotel_id !== access.hotelId) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const { data: item, error: itemError } = await supabaseAdmin.from('order_items').select('id, order_id').eq('id', validated.order_item_id).eq('order_id', validated.order_id).single();
    if (itemError || !item) {
      return new NextResponse(JSON.stringify({ success: false, error: 'Order item not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    const updatePayload: Record<string, any> = { status: 'cancelled' };
    if (await columnExists('order_items', 'cancelled_at')) {
      updatePayload.cancelled_at = new Date().toISOString();
    }
    const reasonText = validated.reason || validated.note || undefined;
    if (await columnExists('order_items', 'cancellation_reason')) {
      if (reasonText && String(reasonText).trim()) {
        updatePayload.cancellation_reason = String(reasonText).trim();
      } else {
        updatePayload.cancellation_reason = null;
      }
    }
    if (await columnExists('order_items', 'cancelled_by')) updatePayload.cancelled_by = 'restaurant';

    const { error: updErr } = await supabaseAdmin.from('order_items').update(updatePayload).eq('id', validated.order_item_id).eq('order_id', validated.order_id);
    if (updErr) throw updErr;

    let allItems: any[] = [];
    const itemsRes = await supabaseAdmin.from('order_items').select('id, status').eq('order_id', validated.order_id);
    if (itemsRes.error && (itemsRes.error.code === '42703' || itemsRes.error.message?.includes('status'))) {
      const { data: allItems2 } = await supabaseAdmin.from('order_items').select('id').eq('order_id', validated.order_id);
      allItems = (allItems2||[]).map((it:any)=>({id:it.id, status: it.id === validated.order_item_id ? 'cancelled' : 'active'}));
    } else {
      allItems = itemsRes.data || [];
    }
    if (allItems && allItems.length > 0) {
      const allCancelled = allItems.every((it: any) => (it.status || '').toLowerCase() === 'cancelled');
      if (allCancelled && order.status !== 'cancelled') {
        const cancelPayload: Record<string, any> = { status: 'cancelled' };
        if (await columnExists('orders', 'cancellation_source')) cancelPayload.cancellation_source = 'hotel';
        if (await columnExists('orders', 'cancelled_by')) cancelPayload.cancelled_by = 'restaurant';
        if (await columnExists('orders', 'cancelled_at')) cancelPayload.cancelled_at = new Date().toISOString();
        if (await columnExists('orders', 'cancellation_reason')) {
          if (reasonText && String(reasonText).trim()) {
            cancelPayload.cancellation_reason = String(reasonText).trim();
          } else {
            cancelPayload.cancellation_reason = null;
          }
        }
        await supabaseAdmin.from('orders').update(cancelPayload).eq('id', validated.order_id);
      }
    }

    await supabaseAdmin.from('order_status_history').insert({ order_id: validated.order_id, status: 'item_cancelled', note: reasonText && String(reasonText).trim() ? 'Item ' + validated.order_item_id + ' cancelled: ' + String(reasonText).trim() : 'Item ' + validated.order_item_id + ' cancelled' });

    return new NextResponse(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to cancel item' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}
