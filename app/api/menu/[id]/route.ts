// app/api/menu/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { menuItemSchema } from '@/lib/menu';
import {
  getMenuSizeSchema,
  menuItemSizesTableAvailable,
  menuItemsSelect,
  normalizeMenuItem,
} from '@/lib/menuSizeSchema.server';

const MISSING_SIZE_MIGRATION =
  'Size options are not available yet: migration 033 has not been applied to this database. Apply supabase/migrations/033_menu_item_sizes.sql in the Supabase SQL editor, then retry.';

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
    const { sizes, ...itemData } = body;
    const validated = menuItemSchema.partial().parse(itemData);
    const sizeSchema = await getMenuSizeSchema();

    // A partial update (for example the dashboard's availability/featured
    // toggle) omits has_sizes. It must NOT be read as "disable sizes", and it
    // must never delete the dish's existing size rows.
    const sizesTouched = validated.has_sizes !== undefined;

    if (validated.has_sizes && (!sizeSchema.table || !sizeSchema.itemColumns)) {
      return NextResponse.json({ success: false, error: MISSING_SIZE_MIGRATION }, { status: 503 });
    }

    const updatePayload: Record<string, any> = { ...validated };
    delete updatePayload.sizes;

    if (!sizesTouched || !sizeSchema.itemColumns) {
      delete updatePayload.has_sizes;
      delete updatePayload.size_selection_required;
    } else {
      updatePayload.has_sizes = Boolean(validated.has_sizes);
      updatePayload.size_selection_required = validated.has_sizes
        ? Boolean(validated.size_selection_required)
        : false;
    }

    const { error } = await supabaseAdmin
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id)
      .eq('hotel_id', access.hotelId)
      .select()
      .single();

    if (error) throw error;

    // Only rewrite size rows when the caller explicitly changed the size
    // configuration. A bare `has_sizes: true` (no sizes array) keeps the
    // existing variants instead of wiping them.
    const sizesProvided = Array.isArray(sizes);
    if (sizeSchema.table && sizesTouched && (validated.has_sizes === false || sizesProvided)) {
      const { error: deleteSizesError } = await supabaseAdmin
        .from('menu_item_sizes')
        .delete()
        .eq('menu_item_id', id)
        .eq('hotel_id', access.hotelId);

      if (deleteSizesError) throw deleteSizesError;

      if (validated.has_sizes && sizesProvided && sizes.length > 0) {
        const sizesToInsert = sizes
          .filter((s: any) => s.name && s.name.trim() && Number(s.price) > 0)
          .map((s: any, index: number) => ({
            menu_item_id: id,
            hotel_id: access.hotelId,
            name: s.name.trim(),
            price: Number(s.price),
            position: s.position ?? index,
            is_available: s.is_available !== false,
          }));

        if (sizesToInsert.length > 0) {
          const { error: sizesError } = await supabaseAdmin
            .from('menu_item_sizes')
            .insert(sizesToInsert);

          if (sizesError) throw sizesError;
        }
      }
    }

    const { data: completeItem, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select(menuItemsSelect(sizeSchema.table))
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, menuItem: normalizeMenuItem(completeItem) });
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

    // The FK is ON DELETE CASCADE, but delete explicitly first so the feature
    // also works on projects where the cascade was not created.
    if (await menuItemSizesTableAvailable()) {
      const { error: sizesError } = await supabaseAdmin
        .from('menu_item_sizes')
        .delete()
        .eq('menu_item_id', id)
        .eq('hotel_id', access.hotelId);

      if (sizesError) throw sizesError;
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