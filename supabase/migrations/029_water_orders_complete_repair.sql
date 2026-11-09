-- supabase/migrations/029_water_orders_complete_repair.sql
--
-- Comprehensive, additive, and idempotent repair for water orders.
-- Adds optional `item_name` and `item_kind` columns to public.order_items
-- and notifies PostgREST to reload its schema cache.
-- Safe to re-run multiple times.

BEGIN;

-- 1. Ensure item_name column exists
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS item_name text;

-- 2. Ensure item_kind column exists
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS item_kind text;

-- 3. Backfill item_name from menu_items.name for existing menu item rows
UPDATE public.order_items oi
   SET item_name = mi.name
  FROM public.menu_items mi
 WHERE oi.menu_item_id = mi.id
   AND oi.item_name IS NULL;

-- 4. Backfill item_kind and item_name for legacy water items
UPDATE public.order_items
   SET item_kind = 'water',
       item_name = COALESCE(item_name, 'Free Water')
 WHERE item_kind IS NULL
   AND (
     menu_item_id IS NULL
     AND (
       LOWER(COALESCE(notes, '')) ~ '(water|normal water|free water|mineral water|cold water)'
       OR LOWER(COALESCE(item_name, '')) ~ '(water|normal water|free water|mineral water|cold water)'
     )
   );

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
