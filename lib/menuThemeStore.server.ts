// lib/menuThemeStore.server.ts
//
// Per-hotel menu-theme persistence backed by the `public.hotels` table.
//
// The previous implementation wrote to `data/menu-themes.json` on the local
// filesystem. On Vercel the deployed filesystem is read-only, so every save
// threw `EROFS: read-only file system, open '/var/task/data/menu-themes.json'`
// and the theme never persisted.
//
// Themes now live in `hotels.menu_theme` (added by migration 010). The
// `hotels` row is already the canonical per-hotel record, so this store is
// simply a thin read/write helper over it. Each hotel's theme is isolated by
// the row itself: Hotel A can never read or write Hotel B's theme.
//
// The service-role client is used because these helpers run inside API route
// handlers that have already authenticated the caller (see
// `requireOwnedHotelId` in ./hotelAccess). RLS stays enabled; the service key
// stays on the server. No secrets are exposed to the browser.

import { supabaseAdmin } from './supabaseAdmin';
import { DEFAULT_MENU_THEME } from './menuThemes';

export async function getStoredMenuTheme(hotelId: string): Promise<string | null> {
  if (!hotelId) return null;
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('menu_theme')
    .eq('id', hotelId)
    .maybeSingle();

  if (error) {
    // 42703 / PGRST204 = the column does not exist yet (migration 010 not applied).
    // Treat as "no theme stored" rather than failing the whole read.
    if (error.code === '42703' || error.code === 'PGRST204') return null;
    console.error('[menuThemeStore] getStoredMenuTheme read failed:', error.message);
    return null;
  }
  return (data as any)?.menu_theme || null;
}

export async function setStoredMenuTheme(hotelId: string, theme: string): Promise<void> {
  if (!hotelId) return;
  const { error } = await supabaseAdmin
    .from('hotels')
    .update({ menu_theme: theme })
    .eq('id', hotelId);

  if (error) {
    // 42703 / PGRST204 = column missing; nothing to do until migration 010 runs.
    if (error.code === '42703' || error.code === 'PGRST204') return;
    throw new Error(`Failed to persist menu theme: ${error.message}`);
  }
}

/** Backwards-compatible alias used by some call sites. */
export async function readThemeStore(): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('id, menu_theme');

  if (error) return {};
  return (data || []).reduce((acc: Record<string, string>, row: any) => {
    if (row.menu_theme) acc[row.id] = row.menu_theme;
    return acc;
  }, {});
}

/** Backwards-compatible alias. No-op safe: the DB is the source of truth. */
export async function writeThemeStore(_data: Record<string, string>): Promise<void> {
  // Intentionally a no-op. Themes are written per-row by setStoredMenuTheme.
}