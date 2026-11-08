// app/api/orders/payments/dashboard/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelIdParam = searchParams.get('hotel_id');

    const access = await requireOwnedHotelId(hotelIdParam);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }
    const hotelId = access.hotelId;

    // Fetch payments joined with orders
    const { data: payments, error: paymentsErr } = await supabaseAdmin
      .from('order_payments')
      .select(`
        id,
        order_id,
        hotel_id,
        amount,
        payment_method,
        transaction_id,
        payer_name,
        split_type,
        split_details,
        status,
        notes,
        created_at,
        orders (
          id,
          order_number,
          table_number,
          total_amount,
          payment_status,
          status,
          customer_name,
          created_at
        )
      `)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(150);

    if (paymentsErr) throw paymentsErr;

    // Group payments by order for quick table overview
    const orderGroups: Record<string, {
      order: any;
      payments: any[];
      totalPaid: number;
      remainingBalance: number;
    }> = {};

    (payments || []).forEach((p: any) => {
      const order = p.orders;
      if (!order) return;
      if (!orderGroups[order.id]) {
        orderGroups[order.id] = {
          order,
          payments: [],
          totalPaid: 0,
          remainingBalance: Number(order.total_amount || 0),
        };
      }
      orderGroups[order.id].payments.push(p);
      if (p.status === 'successful') {
        orderGroups[order.id].totalPaid += Number(p.amount || 0);
      }
    });

    Object.values(orderGroups).forEach((group) => {
      group.totalPaid = Math.round(group.totalPaid * 100) / 100;
      group.remainingBalance = Math.max(0, Math.round((Number(group.order.total_amount || 0) - group.totalPaid) * 100) / 100);
    });

    return NextResponse.json({
      success: true,
      payments: payments || [],
      orderGroups: Object.values(orderGroups),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch dashboard payments' },
      { status: 500 }
    );
  }
}
