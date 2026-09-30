// app/api/reviews/submit/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const reviewSchema = z.object({
  hotel_id: z.string().optional(),
  order_item_id: z.string().optional(),
  menu_item_name: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  customer_name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    // order_item_id is an optional foreign key into public.order_items.
    // Reviews submitted from the QR menu are not always tied to an order
    // line, so an absent value is stored as NULL. The all-zero UUID is
    // never written: it is not a real row, so it can never satisfy the
    // foreign key. A supplied value must be a real UUID.
    const submittedOrderItemId = validated.order_item_id?.trim();

    if (submittedOrderItemId && !z.string().uuid().safeParse(submittedOrderItemId).success) {
      return NextResponse.json(
        { success: false, error: 'order_item_id must be a valid UUID when provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        order_item_id: submittedOrderItemId || null,
        rating: validated.rating,
        comment: validated.comment,
        customer_name: validated.customer_name || 'Guest Diner',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit review' },
      { status: 400 }
    );
  }
}
