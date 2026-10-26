// app/api/hotel/themes/[themeId]/route.ts
//
// Per-theme operations on a saved custom theme.
//
// PATCH /api/hotel/themes/[themeId]   -> rename / edit config / apply
// DELETE /api/hotel/themes/[themeId]  -> delete a saved theme
//
// The hotel id is resolved from the authenticated session and the row is
// scoped to that hotel in every query, so Hotel A cannot touch Hotel B's
// theme even if it guesses the other hotel's theme id.

import { NextResponse } from 'next/server';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import {
  updateSavedCustomTheme,
  applySavedCustomTheme,
  duplicateSavedCustomTheme,
  deleteSavedCustomTheme,
} from '@/lib/hotelCustomThemes.server';

interface Context {
  params: { themeId: string };
}

export async function PATCH(request: Request, { params }: Context) {
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

  const action = body.action || 'update';

  try {
    if (action === 'apply') {
      const theme = await applySavedCustomTheme(access.hotelId, params.themeId);
      if (!theme) {
        return NextResponse.json(
          { success: false, error: 'Saved theme not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, theme, applied: true });
    }

    if (action === 'duplicate') {
      const theme = await duplicateSavedCustomTheme(access.hotelId, params.themeId);
      if (!theme) {
        return NextResponse.json(
          { success: false, error: 'Saved theme not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, theme, duplicated: true }, { status: 201 });
    }

    const patch: { name?: string; theme_config?: any; is_active?: boolean } = {};
    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Theme name cannot be empty' },
          { status: 400 }
        );
      }
      patch.name = name;
    }
    if (body.theme_config !== undefined) patch.theme_config = body.theme_config;
    if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

    const theme = await updateSavedCustomTheme(access.hotelId, params.themeId, patch);
    if (!theme) {
      return NextResponse.json(
        { success: false, error: 'Saved theme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, theme });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update saved theme' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  let body: any = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // body is optional for DELETE
  }

  const access = await requireOwnedHotelId(body.hotel_id);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  try {
    const deleted = await deleteSavedCustomTheme(access.hotelId, params.themeId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Saved theme not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete saved theme' },
      { status: 500 }
    );
  }
}