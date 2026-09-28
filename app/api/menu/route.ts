// app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { menuItemSchema } from '@/lib/menu';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');

    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotel_id is required' },
        { status: 400 }
      );
    }

    const { data: menuItems, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, menuItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotel_id, ...itemData } = body;

    if (!hotel_id) {
      return NextResponse.json(
        { success: false, error: 'hotel_id is required' },
        { status: 400 }
      );
    }

    const validated = menuItemSchema.parse(itemData);

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        hotel_id,
        name: validated.name,
        description: validated.description,
        price: validated.price,
        image_url: validated.image_url,
        model_url_glb: validated.model_url_glb,
        model_url_usdz: validated.model_url_usdz,
        is_available: validated.is_available,
        is_featured: validated.is_featured,
        dietary_tags: validated.dietary_tags,
        calories: validated.calories,
        preparation_time_mins: validated.preparation_time_mins,
        ingredients: validated.ingredients,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, menuItem: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create menu item' },
      { status: 400 }
    );
  }
}
