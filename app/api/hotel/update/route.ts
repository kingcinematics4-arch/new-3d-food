// app/api/hotel/update/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { MENU_THEME_IDS, DEFAULT_MENU_THEME } from '@/lib/menuThemes';
import { setStoredMenuTheme, getStoredMenuTheme } from '@/lib/menuThemeStore.server';

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
});

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validated = updateHotelSchema.parse(body);

    const { hotel_id, ...updateData } = validated;

    const { data, error } = await supabaseAdmin
      .from('hotels')
      .update(updateData)
      .eq('id', hotel_id)
      .select()
      .single();

    if (error) {
      if (
        updateData.menu_theme &&
        error.message?.includes('menu_theme')
      ) {
        const { menu_theme, ...rest } = updateData;

        if (menu_theme) {
          await setStoredMenuTheme(hotel_id, menu_theme);
        }

        if (Object.keys(rest).length > 0) {
          const { data: retryData, error: retryError } = await supabaseAdmin
            .from('hotels')
            .update(rest)
            .eq('id', hotel_id)
            .select()
            .single();
          if (retryError) throw retryError;
          const storedTheme = await getStoredMenuTheme(hotel_id);
          return NextResponse.json({
            success: true,
            hotel: { ...retryData, menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME },
          });
        }
        const { data: currentHotel } = await supabaseAdmin
          .from('hotels')
          .select('*')
          .eq('id', hotel_id)
          .single();
        const storedTheme = await getStoredMenuTheme(hotel_id);
        return NextResponse.json({
          success: true,
          hotel: { ...currentHotel, menu_theme: storedTheme || menu_theme || DEFAULT_MENU_THEME },
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, hotel: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update hotel settings' },
      { status: 400 }
    );
  }
}
