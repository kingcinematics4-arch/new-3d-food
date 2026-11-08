// app/api/hotel/update/route.ts
//
// PUT /api/hotel/update — persist hotel settings including menu theme and water settings.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { getHotelSchema } from '@/lib/hotelSchema';
import { z } from 'zod';
import { MENU_THEME_IDS, DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { setStoredMenuTheme, getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import {
  setStoredCustomTheme,
  getStoredCustomTheme,
  getHotelGoogleReviewUrl,
  setHotelGoogleReviewUrl,
} from '@/lib/customThemeStore.server';
import { sanitizeWaterSettings } from '@/lib/waterSettings';

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
  google_review_url: z.string().url('Enter a valid Google Review URL').optional().nullable(),
  water_settings: z.any().optional(),
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

  // ---- Schema probe: theme columns + Google Review URL column ----
  const schema = await getHotelSchema();
  const themeColumnsPresent = schema.menuTheme && schema.customThemeConfig;
  const themeRequested =
    Boolean(updateData.menu_theme) || Boolean(updateData.custom_theme_config);

  if (themeRequested && !themeColumnsPresent) {
    return NextResponse.json(
      {
        success: false,
        error:
          'The database is missing the theme columns (hotels.menu_theme / hotels.custom_theme_config). ' +
          'Run supabase/migrations/012_theme_columns_idempotent.sql in the Supabase SQL Editor, then save again.',
        schema: { menuTheme: schema.menuTheme, customThemeConfig: schema.customThemeConfig },
      },
      { status: 503 }
    );
  }

  const reviewUrlRequested = Object.prototype.hasOwnProperty.call(updateData, 'google_review_url');

  if (updateData.water_settings) {
    updateData.water_settings = sanitizeWaterSettings(updateData.water_settings);
  }

  try {
    // Persist theme & custom configuration to the hotel's own row.
    if (updateData.menu_theme) {
      await setStoredMenuTheme(hotelId, updateData.menu_theme);
    }
    if (updateData.custom_theme_config) {
      await setStoredCustomTheme(hotelId, updateData.custom_theme_config);
    }

    const strip = (h: any) => {
      if (!h || typeof h !== 'object') return h;
      const o = { ...h };
      delete o.hotel_public_id;
      delete o.user_id;
      return o;
    };

    let persistedReviewUrl: string | null | undefined;
    if (reviewUrlRequested) {
      const result = await setHotelGoogleReviewUrl(hotelId, (updateData as any).google_review_url ?? null);
      persistedReviewUrl = result.value;
    }

    const rowUpdate: any = { ...updateData };
    if (reviewUrlRequested && !schema.googleReviewUrl) {
      delete rowUpdate.google_review_url;
    }
    if (rowUpdate.water_settings && !schema.waterSettings) {
      delete rowUpdate.water_settings;
    }

    const rowKeys = Object.keys(rowUpdate).filter((k) => rowUpdate[k] !== undefined);
    let data: any = null;
    let error: any = null;
    if (rowKeys.length > 0) {
      const res = await supabaseAdmin.from('hotels').update(rowUpdate).eq('id', hotelId).select().single();
      data = res.data;
      error = res.error;
    } else {
      const res = await supabaseAdmin.from('hotels').select('*').eq('id', hotelId).single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      const { menu_theme, custom_theme_config, google_review_url, water_settings, ...rest } = rowUpdate as any;
      if (Object.keys(rest).length > 0) {
        const { data: retryData } = await supabaseAdmin.from('hotels').update(rest).eq('id', hotelId).select().single();
        const storedTheme = await getStoredMenuTheme(hotelId);
        const storedCustomConfig = await getStoredCustomTheme(hotelId);
        const review = reviewUrlRequested ? persistedReviewUrl : await getHotelGoogleReviewUrl(hotelId);
        return NextResponse.json({
          success: true,
          hotel: strip({
            ...retryData,
            google_review_url: review ?? null,
            menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME,
            custom_theme_config: storedCustomConfig || custom_theme_config || null,
          }),
        });
      }
      const { data: currentHotel } = await supabaseAdmin.from('hotels').select('*').eq('id', hotelId).single();
      const storedTheme = await getStoredMenuTheme(hotelId);
      const storedCustomConfig = await getStoredCustomTheme(hotelId);
      const review = reviewUrlRequested ? persistedReviewUrl : await getHotelGoogleReviewUrl(hotelId);
      return NextResponse.json({
        success: true,
        hotel: strip({
          ...currentHotel,
          google_review_url: review ?? null,
          menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME,
          custom_theme_config: storedCustomConfig || custom_theme_config || null,
        }),
      });
    }

    const storedCustomConfig = await getStoredCustomTheme(hotelId);
    const review = reviewUrlRequested ? persistedReviewUrl : await getHotelGoogleReviewUrl(hotelId);
    return NextResponse.json({
      success: true,
      hotel: strip({
        ...data,
        google_review_url: review ?? (data as any)?.google_review_url ?? null,
        custom_theme_config: data?.custom_theme_config || storedCustomConfig || null,
      }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hotel settings' },
      { status: 400 }
    );
  }
}
