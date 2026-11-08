-- supabase/migrations/027_order_items_item_name.sql
--
-- Adds an optional `item_name` column to public.order_items so that
-- water orders (which may not have a real menu_items row) can still
-- display a human-readable product name everywhere they are shown.
--
-- ADDITIVE / IDEMPOTENT. No existing tables, columns, policies, or hotel
-- records are modified. Existing order_items rows keep their values;
-- the new column defaults to NULL and is backfilled from menu_items
-- where a real menu_item_id exists.

begin;

alter table public.order_items
  add column if not exists item_name text;

-- Backfill item_name from menu_items.name for rows that already
-- reference a real menu_item. Safe to re-run: only updates NULLs.
update public.order_items oi
   set item_name = mi.name
  from public.menu_items mi
 where oi.menu_item_id = mi.id
   and oi.item_name is null;

-- Notify PostgREST to reload the schema cache.
notify pgrst, 'reload schema';

commit;