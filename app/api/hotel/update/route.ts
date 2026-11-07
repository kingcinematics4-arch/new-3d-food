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
  // google_review_url can be persisted in existing custom_theme_config JSONB
  // when the dedicated column is unavailable, so do not hard-fail solely on
  // a missing dedicated column. Persistence is handled below.

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

    // Google Review URL: persist via dedicated column when present, and
    // always mirror into existing custom_theme_config JSONB as a resilient
    // fallback (same hotel record, no new columns/tables, no data loss).
    let persistedReviewUrl: string | null | undefined;
    if (reviewUrlRequested) {
      const result = await setHotelGoogleReviewUrl(hotelId, (updateData as any).google_review_url ?? null);
      persistedReviewUrl = result.value;
      console.log('[googleReview][save]', JSON.stringify({
        hotelId,
        hasUrl: Boolean(result.value),
        storedInColumn: result.storedInColumn,
        storedInConfig: result.storedInConfig,
      }));
    }

    // Build hotel-row update payload. If dedicated google_review_url column
    // is missing, omit it from the row update (already persisted to config).
    const rowUpdate: any = { ...updateData };
    if (reviewUrlRequested && !schema.googleReviewUrl) {
      delete rowUpdate.google_review_url;
    }
    // Avoid sending unknown-only payloads; google_review_url handled above.
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
      // Retry without theme/custom fields (legacy behavior) and without
      // google_review_url when column may be problematic.
      const { menu_theme, custom_theme_config, google_review_url, ...rest } = rowUpdate as any;
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