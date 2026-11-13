// lib/menuSizeSchema.server.ts
// SERVER ONLY.
//
// Migration 033 adds the `menu_item_sizes` table, the `menu_items.has_sizes` /
// `size_selection_required` columns and the `order_items.size_*` columns.
// Until that migration has been applied to a project, PostgREST rejects any
// query that references them (PGRST205 / PGRST204) and the whole menu request
// fails. That is exactly how the Size Options update made every dish disappear.
//
// These probes let the API degrade gracefully: dishes keep loading even when
// the migration has not run yet, and size features switch on automatically as
// soon as it has.
import { supabaseAdmin } from './supabaseAdmin';

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: boolean; expiresAt: number }>();

async function probe(key: string, run: () => Promise<boolean>): Promise<boolean> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  let value = false;
  try {
    value = await run();
  } catch {
    value = false;
  }

  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
  return value;
}

/** True when public.menu_item_sizes exists and is queryable. */
export function menuItemSizesTableAvailable(): Promise<boolean> {
  return probe('menu_item_sizes', async () => {
    const { error } = await supabaseAdmin
      .from('menu_item_sizes')
      .select('id')
      .limit(1);
    return !error;
  });
}

/** True when menu_items.has_sizes / size_selection_required exist. */
export function menuItemSizeColumnsAvailable(): Promise<boolean> {
  return probe('menu_items.size_columns', async () => {
    const { error } = await supabaseAdmin
      .from('menu_items')
      .select('has_sizes')
      .limit(1);
    return !error;
  });
}

export interface MenuSizeSchema {
  table: boolean;
  itemColumns: boolean;
}

export async function getMenuSizeSchema(): Promise<MenuSizeSchema> {
  const [table, itemColumns] = await Promise.all([
    menuItemSizesTableAvailable(),
    menuItemSizeColumnsAvailable(),
  ]);
  return { table, itemColumns };
}

const MENU_ITEM_SIZES_SELECT =
  'menu_item_sizes ( id, name, price, position, is_available )';

/**
 * Select string for menu_items. `sizes` is only joined when the child table
 * exists, otherwise PostgREST would fail the entire query.
 */
export function menuItemsSelect(includeSizes: boolean): string {
  return includeSizes
    ? `*, categories ( name ), ${MENU_ITEM_SIZES_SELECT}`
    : '*, categories ( name )';
}

/**
 * Normalizes a menu_items row (with or without the size relation) into the
 * shape used by the dashboard and the public menu.
 */
export function normalizeMenuItem(item: any): any {
  if (!item) return item;

  const { menu_item_sizes, categories, ...rest } = item;
  const rows = Array.isArray(menu_item_sizes) ? menu_item_sizes : [];

  return {
    ...rest,
    category: categories?.name || '',
    has_sizes: Boolean(rest.has_sizes),
    size_selection_required: Boolean(rest.size_selection_required),
    sizes: rows
      .filter((size: any) => size && size.is_available !== false)
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((size: any) => ({
        id: size.id,
        name: size.name,
        price: Number(size.price),
        position: size.position ?? 0,
        is_available: size.is_available !== false,
      })),
  };
}