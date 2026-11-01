-- supabase/migrations/017_order_item_cancellation.sql
-- Add cancellation tracking to order_items for item-level cancellation

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Backfill existing rows
UPDATE public.order_items SET status = 'active' WHERE status IS NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_status ON public.order_items (order_id, status);
