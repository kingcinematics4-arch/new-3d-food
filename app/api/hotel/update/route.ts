// app/api/hotel/update/route.ts
//
// PUT /api/hotel/update — persist hotel settings including menu theme.
//
// AUTHORIZATION: the hotel id is ALWAYS resolved from the authenticated
// Supabase session via `requireOwnedHotelId`. A `hotel_id` in the request body
// is only accepted when it matches the session's own hotel, so a signed-in
// owner can never write into another tenant. This route is therefore
// owner-scoped: no admin role is required, and no global-default theme is
// writable from here.
//
// PERSISTENCE: themes are stored in `public.hotels.menu_theme` and
// `public.hotels.custom_theme_config` (migrations 010/011). The previous
// file-based store (`data/menu-themes.json`) failed on Vercel's read-only
// filesystem with `EROFS: read-only file system, open '/var/task/data/menu-themes.json'`.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { z } from 'zod';
import { MENU_THEME_IDS, DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { setStoredMenuTheme, getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { setStoredCustomTheme, getStoredCustomTheme } from '@/lib/customThemeStore.server';

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
  secondary_color: z.string().optional(),
  menu_style: z.string().optional(),
  card_style: z.string().optional(),
  dark_mode: z.boolean().optional(),
  typography: z.string().optional(),
  welcome_text: z.string().optional(),
  custom_domain: z.string().optional(),
  currency: z.string().optional(),
  tax_rate: z.number().optional(),
  service_charge: z.number().optional(),
  menu_theme: z.enum(MENU_THEME_IDS).optional(),
  custom_theme_config: z.any().optional(),
});

export async function PUT(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  let validated;
  try {
    validated = updateHotelSchema.parse(body);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.issues?.[0]?.message || err.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { hotel_id: requestedHotelId, ...updateData } = validated;

  // ---- Authorization: session-derived hotel id only ----
  const access = await requireOwnedHotelId(requestedHotelId);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }
  const hotelId = access.hotelId;

  try {
    // Persist theme & custom configuration to the hotel's own row.
    if (updateData.menu_theme) {
      await setStoredMenuTheme(hotelId, updateData.menu_theme);
    }
    if (updateData.custom_theme_config) {
      await setStoredCustomTheme(hotelId, updateData.custom_theme_config);
    }

    const { data, error } = await supabaseAdmin
      .from('hotels')
      .update(updateData)
      .eq('id', hotelId)
      .select()
      .single();

    if (error) {
      // If error is due to missing columns (menu_theme, custom_theme_config):
      // strip them and retry so older schemas still save the other fields.
      const { menu_theme, custom_theme_config, ...rest } = updateData;

      if (Object.keys(rest).length > 0) {
        const { data: retryData } = await supabaseAdmin
          .from('hotels')
          .update(rest)
          .eq('id', hotelId)
          .select()
          .single();

        const storedTheme = await getStoredMenuTheme(hotelId);
        const storedCustomConfig = await getStoredCustomTheme(hotelId);

        return NextResponse.json({
          success: true,
          hotel: {
            ...retryData,
            menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME,
            custom_theme_config: storedCustomConfig || custom_theme_config || null,
          },
        });
      }

      // Nothing left to update in the main row; return current state.
      const { data: currentHotel } = await supabaseAdmin
        .from('hotels')
        .select('*')
        .eq('id', hotelId)
        .single();

      const storedTheme = await getStoredMenuTheme(hotelId);
      const storedCustomConfig = await getStoredCustomTheme(hotelId);

      return NextResponse.json({
        success: true,
        hotel: {
          ...currentHotel,
          menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME,
          custom_theme_config: storedCustomConfig || custom_theme_config || null,
        },
      });
    }

    const storedCustomConfig = await getStoredCustomTheme(hotelId);
    return NextResponse.json({
      success: true,
      hotel: {
        ...data,
        custom_theme_config: data?.custom_theme_config || storedCustomConfig || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hotel settings' },
      { status: 400 }
    );
  }
}