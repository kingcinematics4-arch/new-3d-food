// app/api/public/menu/route.ts
// Guest-facing read model behind /menu/[slug].
//
// A diner has no Supabase session, so the browser client cannot resolve
// slug -> hotel: `hotels` is owner/service_role only under RLS (see
// supabase/migrations/003_reconcile_app_schema.sql section 12.1). This route is
// therefore the public lookup, and it is deliberately narrow:
//
//   * only an ACTIVE hotel is resolvable by slug;
//   * columns are listed explicitly - `user_id`, `email`, `phone`, `address`
//     and `owner_name` are owner data and never leave the server;
//   * sold-out dishes are not returned, they cannot be ordered.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const PUBLIC_HOTEL_COLUMNS =
  'id, name, slug, logo_url, currency, welcome_text, primary_color, secondary_color, menu_style, card_style, dark_mode, typography, tax_rate, service_charge, city';

const PUBLIC_MENU_ITEM_COLUMNS =
  'id, category_id, name, description, price, image_url, model_url_glb, model_url_usdz, is_veg, calories, preparation_time_mins, ingredients, allergens, dietary_tags, rating, order_count, is_featured, is_popular';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get('slug') || '').trim().toLowerCase();

    if (!slug) {
      return new NextResponse(JSON.stringify({ success: false, error: 'A restaurant slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const { data: hotel, error: hotelError } = await supabaseAdmin
      .from('hotels')
      .select(PUBLIC_HOTEL_COLUMNS)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (hotelError) throw hotelError;

    if (!hotel) {
      return new NextResponse(JSON.stringify({ success: false, error: 'No menu was found for this restaurant' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const [categoriesResult, itemsResult] = await Promise.all([
      supabaseAdmin
        .from('categories')
        .select('id, name, position')
        .eq('hotel_id', hotel.id)
        .order('position', { ascending: true }),
      supabaseAdmin
        .from('menu_items')
        .select(PUBLIC_MENU_ITEM_COLUMNS)
        .eq('hotel_id', hotel.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false }),
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (itemsResult.error) throw itemsResult.error;

    return new NextResponse(JSON.stringify({
      success: true,
      hotel,
      categories: categoriesResult.data || [],
      menuItems: itemsResult.data || [],
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to load this menu' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}