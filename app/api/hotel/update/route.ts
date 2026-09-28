// app/api/hotel/update/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const updateHotelSchema = z.object({
  hotel_id: z.string().min(1, 'hotel_id is required'),
  name: z.string().optional(),
  owner_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().optional(),
  primary_color: z.string().optional(),
  welcome_text: z.string().optional(),
  custom_domain: z.string().optional(),
  currency: z.string().optional(),
  tax_rate: z.number().optional(),
  service_charge: z.number().optional(),
});

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validated = updateHotelSchema.parse(body);

    const { hotel_id, ...updateData } = validated;

    const { data, error } = await supabaseAdmin
      .from('hotels')
      .update(updateData)
      .eq('id', hotel_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, hotel: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hotel settings' },
      { status: 400 }
    );
  }
}
