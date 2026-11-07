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

const MISSING_COL = new Set(['42703', 'PGRST204', 'PGRST205']);

function cleanReviewUrl(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export async function getStoredCustomTheme(hotelId: string): Promise<CustomThemeConfig | null> {
  if (!hotelId) return null;
  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('custom_theme_config')
    .eq('id', hotelId)
    .maybeSingle();

  if (error) {
    if (MISSING_COL.has(error.code || '')) return null;
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
  // Preserve googleReviewUrl stored inside custom_theme_config unless the
  // incoming config explicitly provides it. This prevents unrelated theme
  // saves from clearing a hotel's configured review link.
  let merged = config as any;
  if (merged && typeof merged === 'object' && !Object.prototype.hasOwnProperty.call(merged, 'googleReviewUrl')) {
    const existing = await getStoredCustomTheme(hotelId);
    const existingUrl = cleanReviewUrl((existing as any)?.googleReviewUrl);
    if (existingUrl) merged = { ...merged, googleReviewUrl: existingUrl };
  }
  const { error } = await supabaseAdmin
    .from('hotels')
    .update({ custom_theme_config: merged })
    .eq('id', hotelId);

  if (error) {
    if (MISSING_COL.has(error.code || '')) return;
    throw new Error(`Failed to persist custom theme config: ${error.message}`);
  }
}

/** Read Google Review URL for a hotel from existing storage.
 *  Prefers the dedicated `google_review_url` column when present; falls back
 *  to `custom_theme_config.googleReviewUrl` (JSONB) so deployments missing
 *  the dedicated column still persist/serve the correct per-hotel URL.
 *  Server-side/service-role only. */
export async function getHotelGoogleReviewUrl(hotelId: string | null | undefined): Promise<string | null> {
  if (!hotelId) return null;
  const trySelect = async (cols: string) => {
    const { data, error } = await supabaseAdmin.from('hotels').select(cols).eq('id', hotelId).maybeSingle();
    if (!error) return { data: data as any, missing: false };
    if (MISSING_COL.has(error.code || '')) return { data: null, missing: true };
    console.error('[googleReview] lookup failed:', { hotelId, code: error.code, message: error.message });
    return { data: null, missing: false };
  };

  const both = await trySelect('google_review_url, custom_theme_config');
  if (!both.missing) {
    return cleanReviewUrl(both.data?.google_review_url) || cleanReviewUrl(both.data?.custom_theme_config?.googleReviewUrl) || null;
  }
  const colOnly = await trySelect('google_review_url');
  if (!colOnly.missing) return cleanReviewUrl(colOnly.data?.google_review_url);
  const cfgOnly = await trySelect('custom_theme_config');
  return cleanReviewUrl(cfgOnly.data?.custom_theme_config?.googleReviewUrl) || null;
}

/** Persist Google Review URL for a hotel using existing storage.
 *  Writes dedicated column when present; always mirrors into
 *  `custom_theme_config.googleReviewUrl` when that column exists so the URL
 *  survives deployments where the dedicated column is absent. Never clears
 *  other custom theme config keys. Returns which stores were used. */
export async function setHotelGoogleReviewUrl(
  hotelId: string,
  url: string | null
): Promise<{ storedInColumn: boolean; storedInConfig: boolean; value: string | null }> {
  if (!hotelId) throw new Error('hotelId is required');
  const value = cleanReviewUrl(url);
  let storedInColumn = false;
  let storedInConfig = false;

  const colWrite = await supabaseAdmin.from('hotels').update({ google_review_url: value }).eq('id', hotelId);
  if (!colWrite.error) storedInColumn = true;
  else if (!MISSING_COL.has(colWrite.error.code || '')) {
    console.error('[googleReview] column write failed:', { hotelId, code: colWrite.error.code, message: colWrite.error.message });
  }

  const cfgRead = await supabaseAdmin.from('hotels').select('custom_theme_config').eq('id', hotelId).maybeSingle();
  if (!cfgRead.error) {
    const existing = (cfgRead.data as any)?.custom_theme_config;
    const base = existing && typeof existing === 'object' ? { ...existing } : {};
    if (value) base.googleReviewUrl = value;
    else delete base.googleReviewUrl;
    const cfgWrite = await supabaseAdmin.from('hotels').update({ custom_theme_config: base }).eq('id', hotelId);
    if (!cfgWrite.error) storedInConfig = true;
    else console.error('[googleReview] config write failed:', { hotelId, code: cfgWrite.error.code, message: cfgWrite.error.message });
  } else if (!MISSING_COL.has(cfgRead.error.code || '')) {
    console.error('[googleReview] config read failed:', { hotelId, code: cfgRead.error.code, message: cfgRead.error.message });
  }

  if (!storedInColumn && !storedInConfig) {
    throw new Error('Unable to persist Google Review URL: required hotel storage columns are unavailable. Run migration 024_hotel_google_review_url.sql or ensure custom_theme_config exists.');
  }
  return { storedInColumn, storedInConfig, value };
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