-- supabase/migrations/015_order_cancellation_reason.sql
--
-- Add cancellation tracking columns to public.orders so the customer-side
-- cancellation flow can record *why* an order was cancelled and *who* did it,
-- without ever asking the customer for a phone number again.
--
-- Columns:
--   cancellation_reason text   -- free-form reason text (selected reason, or 'Other' explanation)
--   cancelled_by        text   -- 'customer' or 'restaurant'; defaults to NULL
--
-- Idempotent / safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS.
-- RLS and existing policies are untouched.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- Index so the dashboard can list cancelled orders by reason/initiator quickly.
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by_reason
  ON public.orders (cancelled_by, cancellation_reason)
  WHERE status = 'cancelled';

-- Verify (read-only, safe to run any time)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
  AND column_name IN ('cancellation_reason', 'cancelled_by')
ORDER BY ordinal_position;
