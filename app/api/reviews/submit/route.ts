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

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        order_item_id: validated.order_item_id || '00000000-0000-0000-0000-000000000000',
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
