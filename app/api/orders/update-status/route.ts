// app/api/orders/update-status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const updateStatusSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    // 1. Update order status
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: validated.status })
      .eq('id', validated.order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 2. Add history record
    await supabaseAdmin.from('order_status_history').insert({
      order_id: validated.order_id,
      status: validated.status,
      note: validated.note || `Status changed to ${validated.status}`,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: 400 }
    );
  }
}
