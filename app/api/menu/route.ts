// app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { menuItemSchema } from '@/lib/menu';
import {
  getMenuSizeSchema,
  menuItemsSelect,
  normalizeMenuItem,
} from '@/lib/menuSizeSchema.server';

const MISSING_SIZE_MIGRATION =
  'Size options are not available yet: migration 033 has not been applied to this database. Apply supabase/migrations/033_menu_item_sizes.sql in the Supabase SQL editor, then retry.';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedHotelId = searchParams.get('hotel_id');

    // A dashboard request does not have to know the hotel: it is resolved from
    // the authenticated Supabase session (auth.uid() -> public.hotels.user_id).
    // That is why the hotel id is never supplied by the browser and never hardcoded.
    let hotelId = requestedHotelId;
    if (!hotelId) {
      const access = await requireOwnedHotelId(null);
      if (!access.ok) {
        return NextResponse.json({ success: false, error: access.error }, { status: access.status });
      }
      hotelId = access.hotelId;
    }

    const sizeSchema = await getMenuSizeSchema();

    const fetchItems = (includeSizes: boolean) =>
      supabaseAdmin
        .from('menu_items')
        .select(menuItemsSelect(includeSizes))
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false });

    let { data: menuItems, error } = await fetchItems(sizeSchema.table);

    // A stale PostgREST schema cache can still reject the size join even when
    // the probe succeeded. Retry once without it so dishes are never hidden.
    if (error && sizeSchema.table) {
      const retry = await fetchItems(false);
      if (!retry.error) {
        menuItems = retry.data;
        error = null;
      }
    }

    if (error) throw error;

    const items = (menuItems || []).map((item: any) => normalizeMenuItem(item));

    return NextResponse.json({ success: true, menuItems: items });
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
    const { hotel_id: requestedHotelId, sizes, ...itemData } = body;

    // The owner hotel always comes from the authenticated session. A hotel_id in
    // the body is only accepted when it matches that hotel.
    const access = await requireOwnedHotelId(requestedHotelId);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const validated = menuItemSchema.parse(itemData);
    const sizeSchema = await getMenuSizeSchema();

    // Never create a half-configured size-enabled dish: the child table must
    // exist before any size rows can be written.
    if (validated.has_sizes && (!sizeSchema.table || !sizeSchema.itemColumns)) {
      return NextResponse.json({ success: false, error: MISSING_SIZE_MIGRATION }, { status: 503 });
    }

    const insertPayload: Record<string, any> = {
      hotel_id: access.hotelId,
      category_id: validated.category_id || null,
      name: validated.name,
      description: validated.description,
      price: validated.price,
      image_url: validated.image_url,
      model_url_glb: validated.model_url_glb,
      model_url_usdz: validated.model_url_usdz,
      is_available: validated.is_available,
      is_featured: validated.is_featured,
      is_popular: validated.is_popular,
      is_veg: validated.is_veg,
      allergens: validated.allergens,
      rating: validated.rating,
      order_count: validated.order_count,
      dietary_tags: validated.dietary_tags,
      calories: validated.calories,
      preparation_time_mins: validated.preparation_time_mins,
      ingredients: validated.ingredients,
    };

    // Only write the new columns when the migration has been applied. Otherwise
    // PostgREST rejects the INSERT with "column does not exist" and the dish
    // would not be created at all.
    if (sizeSchema.itemColumns) {
      insertPayload.has_sizes = Boolean(validated.has_sizes);
      insertPayload.size_selection_required = Boolean(validated.size_selection_required);
    }

    const { data: menuItem, error: itemError } = await supabaseAdmin
      .from('menu_items')
      .insert(insertPayload)
      .select()
      .single();

    if (itemError) throw itemError;

    // Insert sizes if provided
    if (sizeSchema.table && validated.has_sizes && sizes && sizes.length > 0) {
      const sizesToInsert = sizes
        .filter((s: any) => s.name && s.name.trim() && Number(s.price) > 0)
        .map((s: any, index: number) => ({
          menu_item_id: menuItem.id,
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

    const { data: completeItem, error: fetchError } = await supabaseAdmin
      .from('menu_items')
      .select(menuItemsSelect(sizeSchema.table))
      .eq('id', menuItem.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(
      { success: true, menuItem: normalizeMenuItem(completeItem) },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create menu item' },
      { status: 400 }
    );
  }
}