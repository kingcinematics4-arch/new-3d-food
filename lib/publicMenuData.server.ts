import { supabaseAdmin } from './supabaseAdmin';
import { getHotelSchema } from './hotelSchema';
import { getStoredMenuTheme } from './menuThemeStore.server';
import { getStoredCustomTheme } from './customThemeStore.server';
import { getActiveSavedCustomTheme } from './hotelCustomThemes.server';
import { DEFAULT_MENU_THEME } from './menuThemes';
import { sanitizeWaterSettings, HotelWaterSettings } from './waterSettings';
import { getMenuSizeSchema, normalizeMenuItem } from './menuSizeSchema.server';

export const BASE_HOTEL_COLUMNS =
  'id, name, slug, logo_url, currency, welcome_text, primary_color, ' +
  'secondary_color, menu_style, card_style, dark_mode, typography, ' +
  'tax_rate, service_charge, city';

export const PUBLIC_MENU_ITEM_COLUMNS =
  'id, category_id, name, description, price, image_url, model_url_glb, model_url_usdz, is_veg, calories, preparation_time_mins, ingredients, allergens, dietary_tags, rating, order_count, is_featured, is_popular';

export const PUBLIC_MENU_ITEM_SIZES_COLUMNS =
  'id, name, price, position, is_available';

export interface PublicHotelData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string | null;
  welcome_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  menu_style: string | null;
  card_style: string | null;
  dark_mode: boolean | null;
  typography: string | null;
  tax_rate: number | null;
  service_charge: number | null;
  city: string | null;
  menu_theme: string | null;
  custom_theme_config?: any | null;
  water_settings?: HotelWaterSettings | null;
}

export interface PublicCategoryData {
  id: string;
  name: string;
  position: number | null;
}

export interface PublicMenuItemSizeData {
  id: string;
  name: string;
  price: number;
  position: number;
  is_available: boolean;
}

export interface PublicMenuItemData {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url_glb: string | null;
  model_url_usdz: string | null;
  is_veg: boolean;
  calories: number | null;
  preparation_time_mins: number | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  dietary_tags: string[] | null;
  rating: number | null;
  order_count: number | null;
  is_featured: boolean;
  is_popular: boolean;
  has_sizes: boolean;
  size_selection_required: boolean;
  sizes?: PublicMenuItemSizeData[];
}

export interface PublicMenuData {
  hotel: PublicHotelData | null;
  categories: PublicCategoryData[];
  menuItems: PublicMenuItemData[];
  error: string | null;
}

async function resolveHotelColumns(): Promise<string> {
  const schema = await getHotelSchema();
  const optional = [
    schema.menuTheme ? 'menu_theme' : null,
    schema.customThemeConfig ? 'custom_theme_config' : null,
    schema.waterSettings ? 'water_settings' : null,
  ].filter(Boolean) as string[];

  return optional.length
    ? `${BASE_HOTEL_COLUMNS}, ${optional.join(', ')}`
    : BASE_HOTEL_COLUMNS;
}

export async function fetchPublicMenuData(slug: string): Promise<PublicMenuData> {
  if (!slug) {
    return { hotel: null, categories: [], menuItems: [], error: 'A restaurant slug is required' };
  }

  const hotelColumns = await resolveHotelColumns();
  const result = await supabaseAdmin
    .from('hotels')
    .select(hotelColumns)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (result.error) {
    return { hotel: null, categories: [], menuItems: [], error: result.error.message || 'Failed to lookup restaurant' };
  }

  const hotel = (result.data as Record<string, any> | null);

  if (!hotel) {
    return { hotel: null, categories: [], menuItems: [], error: 'No menu was found for this restaurant' };
  }

  // Resolve theme: prefer DB column, fall back to file store, then default.
  if (!hotel.menu_theme) {
    const storedTheme = await getStoredMenuTheme(hotel.id);
    if (storedTheme) {
      hotel.menu_theme = storedTheme;
    } else {
      hotel.menu_theme = DEFAULT_MENU_THEME;
    }
  }

  // Resolve custom theme configuration per hotel
  if (!hotel.custom_theme_config) {
    const storedCustomTheme = await getStoredCustomTheme(hotel.id);
    if (storedCustomTheme) {
      hotel.custom_theme_config = storedCustomTheme;
    } else if (hotel.menu_theme === 'custom') {
      const active = await getActiveSavedCustomTheme(hotel.id);
      hotel.custom_theme_config = (active as any)?.theme_config || null;
    } else {
      hotel.custom_theme_config = null;
    }
  }

  // Sanitize water settings
  hotel.water_settings = sanitizeWaterSettings(hotel.water_settings);

  // Size columns/relation only exist after migration 033. Referencing them on a
  // project where it has not run makes PostgREST fail the whole menu query and
  // every dish disappears. Probe first, then degrade to the plain menu.
  const sizeSchema = await getMenuSizeSchema();

  const baseItemColumns = sizeSchema.itemColumns
    ? `${PUBLIC_MENU_ITEM_COLUMNS}, has_sizes, size_selection_required`
    : PUBLIC_MENU_ITEM_COLUMNS;
  const itemsSelect = sizeSchema.table
    ? `${baseItemColumns}, menu_item_sizes ( ${PUBLIC_MENU_ITEM_SIZES_COLUMNS} )`
    : baseItemColumns;

  const fetchItems = (includeSizes: boolean) =>
    supabaseAdmin
      .from('menu_items')
      .select(includeSizes ? itemsSelect : baseItemColumns)
      .eq('hotel_id', hotel.id)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

  const [categoriesResult, itemsResult] = await Promise.all([
    supabaseAdmin
      .from('categories')
      .select('id, name, position')
      .eq('hotel_id', hotel.id)
      .order('position', { ascending: true }),
    fetchItems(sizeSchema.table),
  ]);

  if (categoriesResult.error) {
    return { hotel: hotel as PublicHotelData, categories: [], menuItems: [], error: categoriesResult.error.message || 'Failed to load categories' };
  }

  let itemsData = itemsResult.data;
  let itemsError = itemsResult.error;

  // Belt-and-braces: a stale PostgREST schema cache can still reject the size
  // join even though the probe passed. Retry without it rather than hide dishes.
  if (itemsError && sizeSchema.table) {
    const retry = await fetchItems(false);
    if (!retry.error) {
      itemsData = retry.data;
      itemsError = null;
    }
  }

  if (itemsError) {
    return { hotel: hotel as PublicHotelData, categories: categoriesResult.data || [], menuItems: [], error: itemsError.message || 'Failed to load menu items' };
  }

  const menuItems = (itemsData || []).map((item: any) => normalizeMenuItem(item));

  return {
    hotel: hotel as PublicHotelData,
    categories: (categoriesResult.data || []) as PublicCategoryData[],
    menuItems,
    error: null,
  };
}
