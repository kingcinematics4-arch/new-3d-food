// lib/customThemeStore.server.ts
//
// Per-hotel custom theme configuration persistence backed by the
// `public.hotels.custom_theme_config` JSONB column (migration 011).
//
// The previous implementation wrote to `data/custom-themes.json` on the local
// filesystem, which failed on Vercel with `EROFS: read-only file system`.
//
// Each hotel's custom theme is stored in its own `hotels` row, so Hotel A's
// bespoke design can never leak into Hotel B's public menu. The service-role
// client is used only inside API route handlers that have already
// authenticated the caller; RLS stays enabled and the service key stays on
// the server.

import { supabaseAdmin } from './supabaseAdmin';
import type { CustomThemeConfig } from './customTheme';

export async function getStoredCustomTheme(hotelId: string): Promise<CustomThemeConfig | null> {
  if (!hotelId) return null;
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('custom_theme_config')
    .eq('id', hotelId)
    .maybeSingle();

  if (error) {
    // 42703 / PGRST204 = column missing (migration 011 not applied).
    if (error.code === '42703' || error.code === 'PGRST204') return null;
    console.error('[customThemeStore] getStoredCustomTheme read failed:', error.message);
    return null;
  }
  return (data as any)?.custom_theme_config || null;
}

export async function setStoredCustomTheme(
  hotelId: string,
  config: CustomThemeConfig
): Promise<void> {
  if (!hotelId) return;
  const { error } = await supabaseAdmin
    .from('hotels')
    .update({ custom_theme_config: config })
    .eq('id', hotelId);

  if (error) {
    if (error.code === '42703' || error.code === 'PGRST204') return;
    throw new Error(`Failed to persist custom theme config: ${error.message}`);
  }
}

/** Backwards-compatible aliases. */
export async function readCustomThemeStore(): Promise<Record<string, CustomThemeConfig>> {
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('id, custom_theme_config');

  if (error) return {};
  return (data || []).reduce((acc: Record<string, CustomThemeConfig>, row: any) => {
    if (row.custom_theme_config) acc[row.id] = row.custom_theme_config;
    return acc;
  }, {});
}

export async function writeCustomThemeStore(_data: Record<string, CustomThemeConfig>): Promise<void> {
  // Intentionally a no-op. Configs are written per-row by setStoredCustomTheme.
}