// app/api/hotel/themes/route.ts
//
// Saved Custom Themes library API.
//
// GET  /api/hotel/themes          -> list this owner's saved themes
// POST /api/hotel/themes          -> create a new saved theme
//
// The hotel id is ALWAYS resolved from the authenticated Supabase session
// via `requireOwnedHotelId`. A `hotel_id` in the request body is only accepted
// when it matches the session's own hotel, so a signed-in owner can never
// read or write another tenant's theme library.

import { NextResponse } from 'next/server';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import {
  listSavedCustomThemes,
  createSavedCustomTheme,
} from '@/lib/hotelCustomThemes.server';
import type { CustomThemeConfig } from '@/lib/customTheme';

export async function GET() {
  try {
    const access = await requireOwnedHotelId();
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const themes = await listSavedCustomThemes(access.hotelId);
    return NextResponse.json({ success: true, themes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load saved themes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const access = await requireOwnedHotelId(body.hotel_id);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json(
      { success: false, error: 'Theme name is required' },
      { status: 400 }
    );
  }

  const themeConfig = body.theme_config as CustomThemeConfig | undefined;
  if (!themeConfig || typeof themeConfig !== 'object') {
    return NextResponse.json(
      { success: false, error: 'A theme configuration is required' },
      { status: 400 }
    );
  }

  try {
    const created = await createSavedCustomTheme(access.hotelId, {
      name,
      theme_config: themeConfig,
      is_active: Boolean(body.apply_now),
    });

    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Failed to create saved theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, theme: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create saved theme' },
      { status: 500 }
    );
  }
}