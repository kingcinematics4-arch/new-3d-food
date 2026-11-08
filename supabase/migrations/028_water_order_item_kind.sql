-- supabase/migrations/028_water_order_item_kind.sql
--
-- Adds `item_kind` to public.order_items so water orders can be identified
-- by a stable type field (not by product-name text matching).
-- Values: NULL (regular/unknown) | 'water'. Additive + idempotent.
-- Existing rows preserved; best-effort backfill for legacy water rows.

begin;

alter table public.order_items
  add column if not exists item_kind text;

-- Best-effort backfill for legacy water items (safe to re-run: only NULLs).
update public.order_items
   set item_kind = 'water'
 where item_kind is null
   and (
     menu_item_id is null
     and lower(coalesce(item_name, '')) ~ '(water|normal water|free water|mineral water|cold water)'
   );

notify pgrst, 'reload schema';

commit;
