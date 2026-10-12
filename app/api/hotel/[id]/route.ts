import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { getStoredCustomTheme } from '@/lib/customThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: hotel, error } = await supabaseAdmin
      .from('hotels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const storedTheme = await getStoredMenuTheme(id);
    const storedCustomConfig = await getStoredCustomTheme(id);
    const hotelWithTheme = {
      ...hotel,
      menu_theme: hotel?.menu_theme || storedTheme || DEFAULT_MENU_THEME,
      custom_theme_config: hotel?.custom_theme_config || storedCustomConfig || null,
    };

    return NextResponse.json({ success: true, hotel: hotelWithTheme });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch hotel' },
      { status: 500 }
    );
  }
}