-- supabase/migrations/030_orders_linked_order_id.sql
--
-- Adds `linked_order_id` to public.orders so water orders can reference
-- their parent food order for combined billing. Additive + idempotent.
-- Existing rows preserved; column defaults to NULL (standalone order).

begin;

alter table public.orders
  add column if not exists linked_order_id uuid references public.orders(id);

-- Index for fast lookup of linked orders (e.g. water orders linked to a food order).
create index if not exists idx_orders_linked_order_id on public.orders(linked_order_id);

notify pgrst, 'reload schema';

commit;
