import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getStoredMenuTheme } from '@/lib/menuThemeStore.server';
import { getStoredCustomTheme } from '@/lib/customThemeStore.server';
import { DEFAULT_MENU_THEME } from '@/lib/menuThemes';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Use select('*') (server/service-role context) so this remains
    // schema-tolerant when optional columns are added/missing across
    // deployments. Public responses still omit sensitive/internal fields.
    const { data: hotel, error } = await supabaseAdmin
      .from('hotels')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!hotel) return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    const storedTheme = await getStoredMenuTheme(id);
    const storedCustomConfig = await getStoredCustomTheme(id);
    const out: any = {
      ...hotel,
      menu_theme: (hotel as any)?.menu_theme || storedTheme || DEFAULT_MENU_THEME,
      custom_theme_config: (hotel as any)?.custom_theme_config || storedCustomConfig || null,
    };
    delete out.user_id;
    delete out.hotel_public_id;
    return NextResponse.json({ success: true, hotel: out });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch hotel' }, { status: 500 });
  }
}