-- Targeted fix for the reported errors (safe to run in SQL Editor)
BEGIN;
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status             text         DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at       timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by       text;
UPDATE public.order_items SET status = 'active' WHERE status IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_status ON public.order_items (order_id, status);
NOTIFY pgrst, 'reload schema';
COMMIT;