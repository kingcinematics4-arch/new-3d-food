import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { getStoredCustomTheme } from '@/lib/customThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: hotel, error } = await supabaseAdmin.from('hotels').select('id, name, slug, logo_url, currency, welcome_text, primary_color, secondary_color, menu_style, card_style, dark_mode, typography, tax_rate, service_charge, city, menu_theme, custom_theme_config, is_active').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!hotel) return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    const storedTheme = await getStoredMenuTheme(id);
    const storedCustomConfig = await getStoredCustomTheme(id);
    return NextResponse.json({ success: true, hotel: { ...hotel, menu_theme: (hotel as any)?.menu_theme || storedTheme || DEFAULT_MENU_THEME, custom_theme_config: (hotel as any)?.custom_theme_config || storedCustomConfig || null } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch hotel' }, { status: 500 });
  }
}