// app/api/menu/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { menuItemSchema } from '@/lib/menu';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // supabaseAdmin bypasses RLS, so ownership is enforced here instead: the
    // dish must belong to the hotel the authenticated session owns.
    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { data: owned, error: ownedError } = await supabaseAdmin
      .from('menu_items')
      .select('id')
      .eq('id', id)
      .eq('hotel_id', access.hotelId)
      .maybeSingle();

    if (ownedError) throw ownedError;
    if (!owned) {
      return NextResponse.json(
        { success: false, error: 'Dish not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = menuItemSchema.partial().parse(body);

    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(validated)
      .eq('id', id)
      .eq('hotel_id', access.hotelId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, menuItem: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update menu item' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('hotel_id', access.hotelId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete menu item' },
      { status: 400 }
    );
  }
}
