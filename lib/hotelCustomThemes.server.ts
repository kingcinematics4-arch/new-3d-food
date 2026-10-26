// lib/hotelCustomThemes.server.ts
//
// Saved Custom Themes library (migration 013 -> `public.hotel_custom_themes`).
//
// Each hotel owns its own library of named, restorable custom themes. Writes
// go through the service-role client inside API route handlers that have
// already authenticated the caller, so RLS stays enabled and the service key
// stays on the server. The hotel id passed in is always the one resolved by
// `requireOwnedHotelId` from the authenticated session — never a client id.

import { supabaseAdmin } from './supabaseAdmin';
import type { CustomThemeConfig } from './customTheme';

export interface SavedCustomTheme {
  id: string;
  hotel_id: string;
  name: string;
  theme_config: CustomThemeConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const MISSING_TABLE_CODES = new Set(['PGRST205', 'PGRST204', '42P01']);

function isMissingTable(error: { code?: string } | null): boolean {
  return Boolean(error?.code && MISSING_TABLE_CODES.has(error.code));
}

export async function listSavedCustomThemes(
  hotelId: string
): Promise<SavedCustomTheme[]> {
  if (!hotelId) return [];
  const { data, error } = await supabaseAdmin
    .from('hotel_custom_themes')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTable(error)) return [];
    console.error('[hotelCustomThemes] list failed:', error.message);
    return [];
  }
  return (data || []) as SavedCustomTheme[];
}

export async function getActiveSavedCustomTheme(
  hotelId: string
): Promise<SavedCustomTheme | null> {
  if (!hotelId) return null;
  const { data, error } = await supabaseAdmin
    .from('hotel_custom_themes')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return null;
    console.error('[hotelCustomThemes] getActive failed:', error.message);
    return null;
  }
  return (data as SavedCustomTheme) || null;
}

export async function createSavedCustomTheme(
  hotelId: string,
  input: { name: string; theme_config: CustomThemeConfig; is_active?: boolean }
): Promise<SavedCustomTheme | null> {
  if (!hotelId) return null;
  const name = (input.name || '').trim();
  if (!name) throw new Error('Theme name is required');

  const { data, error } = await supabaseAdmin
    .from('hotel_custom_themes')
    .insert({
      hotel_id: hotelId,
      name,
      theme_config: input.theme_config,
      is_active: Boolean(input.is_active),
    })
    .select('*')
    .single();

  if (error) {
    if (isMissingTable(error)) throw new Error('The saved-themes table is missing. Run supabase/migrations/013_hotel_custom_themes.sql.');
    throw new Error(`Failed to save theme: ${error.message}`);
  }
  return data as SavedCustomTheme;
}

export async function updateSavedCustomTheme(
  hotelId: string,
  themeId: string,
  patch: { name?: string; theme_config?: CustomThemeConfig; is_active?: boolean }
): Promise<SavedCustomTheme | null> {
  if (!hotelId || !themeId) return null;

  const { data, error } = await supabaseAdmin
    .from('hotel_custom_themes')
    .update(patch)
    .eq('id', themeId)
    .eq('hotel_id', hotelId)
    .select('*')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) throw new Error('The saved-themes table is missing. Run supabase/migrations/013_hotel_custom_themes.sql.');
    throw new Error(`Failed to update theme: ${error.message}`);
  }
  return (data as SavedCustomTheme) || null;
}

export async function applySavedCustomTheme(
  hotelId: string,
  themeId: string
): Promise<SavedCustomTheme | null> {
  // The exclusive-active trigger clears every other row in this hotel, so a
  // single UPDATE flips exactly one theme and the public menu picks it up.
  return updateSavedCustomTheme(hotelId, themeId, { is_active: true });
}

export async function duplicateSavedCustomTheme(
  hotelId: string,
  themeId: string
): Promise<SavedCustomTheme | null> {
  const source = await updateSavedCustomTheme(hotelId, themeId, {});
  if (!source) return null;

  return createSavedCustomTheme(hotelId, {
    name: `${source.name} copy`,
    theme_config: source.theme_config,
    is_active: false,
  });
}

export async function deleteSavedCustomTheme(
  hotelId: string,
  themeId: string
): Promise<boolean> {
  if (!hotelId || !themeId) return false;

  const { data, error } = await supabaseAdmin
    .from('hotel_custom_themes')
    .delete()
    .eq('id', themeId)
    .eq('hotel_id', hotelId)
    .select('id')
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) throw new Error('The saved-themes table is missing. Run supabase/migrations/013_hotel_custom_themes.sql.');
    throw new Error(`Failed to delete theme: ${error.message}`);
  }
  return Boolean(data);
}