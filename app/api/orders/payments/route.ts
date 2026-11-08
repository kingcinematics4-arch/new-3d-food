// app/api/orders/payments/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { getHotelGoogleReviewUrl } from '@/lib/customThemeStore.server';
import { z } from 'zod';

const createPaymentSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['upi', 'card', 'cash', 'pay_at_table']).default('upi'),
  transaction_id: z.string().optional(),
  payer_name: z.string().optional(),
  split_type: z.enum(['equal', 'items', 'custom']).default('custom'),
  split_details: z.any().optional(),
  status: z.enum(['successful', 'pending', 'failed']).default('successful'),
  notes: z.string().optional(),
});

// GET: Fetch payments for an order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
        { status: 400 }
      );
    }

    // Fetch order first to get total and status
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, total_amount, payment_status, status, table_number, order_number')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const { data: payments, error: paymentsErr } = await supabaseAdmin
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (paymentsErr) throw paymentsErr;

    const successfulPayments = (payments || []).filter((p) => p.status === 'successful');
    const totalPaid = successfulPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const billTotal = Number(order.total_amount || 0);
    const remainingBalance = Math.max(0, Math.round((billTotal - totalPaid) * 100) / 100);

    return NextResponse.json({
      success: true,
      order,
      billTotal,
      totalPaid,
      remainingBalance,
      payments: payments || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST: Record a payment (split or full)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

    // 1. Fetch current order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, hotel_id, total_amount, payment_status, status')
      .eq('id', validated.order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if ((order.status || '').toLowerCase() === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot accept payment for a cancelled order' },
        { status: 400 }
      );
    }

    // 2. Idempotency / duplicate check for transaction_id
    if (validated.transaction_id && validated.transaction_id.trim()) {
      const { data: existingTx } = await supabaseAdmin
        .from('order_payments')
        .select('*')
        .eq('transaction_id', validated.transaction_id.trim())
        .maybeSingle();

      if (existingTx) {
        return NextResponse.json(
          {
            success: true,
            duplicate: true,
            message: 'Payment with this transaction ID was already processed',
            payment: existingTx,
          },
          { status: 200 }
        );
      }
    }

    // 3. Fetch existing successful payments to calculate balance
    const { data: existingPayments } = await supabaseAdmin
      .from('order_payments')
      .select('amount, status')
      .eq('order_id', order.id)
      .eq('status', 'successful');

    const totalPaidBefore = (existingPayments || []).reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    const billTotal = Number(order.total_amount || 0);
    const currentRemaining = Math.max(0, Math.round((billTotal - totalPaidBefore) * 100) / 100);

    // If payment is successful, ensure it does not exceed the remaining balance (allow minor rounding up to ₹0.50)
    if (validated.status === 'successful') {
      if (currentRemaining <= 0) {
        return NextResponse.json(
          { success: false, error: 'This bill is already fully settled' },
          { status: 400 }
        );
      }

      if (validated.amount > currentRemaining + 0.5) {
        return NextResponse.json(
          {
            success: false,
            error: `Payment amount (${validated.amount}) exceeds remaining balance (${currentRemaining})`,
          },
          { status: 400 }
        );
      }
    }

    // Generate unique transaction ID if not provided
    const transactionId =
      validated.transaction_id?.trim() ||
      `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 4. Insert into order_payments
    const { data: insertedPayment, error: insertErr } = await supabaseAdmin
      .from('order_payments')
      .insert({
        order_id: order.id,
        hotel_id: order.hotel_id,
        amount: validated.amount,
        payment_method: validated.payment_method,
        transaction_id: transactionId,
        payer_name: validated.payer_name?.trim() || 'Guest',
        split_type: validated.split_type,
        split_details: validated.split_details || null,
        status: validated.status,
        notes: validated.notes?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 5. If successful, update the parent order's payment_status and amount_paid
    let updatedPaymentStatus = order.payment_status;
    let newTotalPaid = totalPaidBefore;
    let newRemaining = currentRemaining;

    if (validated.status === 'successful') {
      newTotalPaid = Math.round((totalPaidBefore + validated.amount) * 100) / 100;
      newRemaining = Math.max(0, Math.round((billTotal - newTotalPaid) * 100) / 100);

      // Settle status
      if (newRemaining <= 0.01) {
        updatedPaymentStatus = 'paid';
      } else {
        updatedPaymentStatus = 'partially_paid';
      }

      const now = new Date().toISOString();
      const orderUpdate: any = {
        payment_status: updatedPaymentStatus,
        updated_at: now,
      };
      if (updatedPaymentStatus === 'paid') {
        orderUpdate.paid_at = now;
      }

      // Also attempt updating amount_paid column if schema has it
      orderUpdate.amount_paid = newTotalPaid;

      const { error: updateOrderErr } = await supabaseAdmin
        .from('orders')
        .update(orderUpdate)
        .eq('id', order.id);

      // If amount_paid column doesn't exist yet, retry without it
      if (updateOrderErr) {
        delete orderUpdate.amount_paid;
        await supabaseAdmin
          .from('orders')
          .update(orderUpdate)
          .eq('id', order.id);
      }
    }

    const reviewUrl = await getHotelGoogleReviewUrl(order.hotel_id);

    return NextResponse.json({
      success: true,
      payment: insertedPayment,
      payment_status: updatedPaymentStatus,
      billTotal,
      totalPaid: newTotalPaid,
      remainingBalance: newRemaining,
      isFullyPaid: updatedPaymentStatus === 'paid',
      google_review_url: updatedPaymentStatus === 'paid' ? reviewUrl : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
