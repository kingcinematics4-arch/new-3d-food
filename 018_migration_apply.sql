-- =============================================================================
-- supabase/migrations/018_apply_pending_migrations.sql
--
-- CONSOLIDATED FORWARD-ONLY MIGRATION
-- Applies the net effect of migrations 007 â†’ 017 that were authored locally
-- but never executed against the live database
-- (sqfuoqmmaorjxlleggfu.supabase.co).
--
-- LIVE SCHEMA AUDIT â€” 2026-11-02
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- public.orders (actual live columns):
--   id, hotel_id, customer_name, customer_phone, table_number, notes, status,
--   payment_status, payment_method, subtotal, tax, service_charge,
--   total_amount, created_at
--   MISSING: updated_at (007), order_number (008),
--            cancellation_reason, cancelled_by, cancellation_source,
--            cancelled_at (015/016)
--
-- public.order_items (actual live columns):
--   id, order_id, menu_item_id, quantity, price_at_time, notes, created_at
--   MISSING: status, cancelled_at, cancellation_reason, cancelled_by (017)
--
-- Records to preserve: 52 orders, 69 order_items
--
-- GUARANTEES
--   â€¢ Every ALTER uses ADD COLUMN IF NOT EXISTS  â†’ safe to re-run
--   â€¢ No DROP TABLE, TRUNCATE, DELETE, or RESET
--   â€¢ No RLS changes; existing policies are untouched
--   â€¢ No duplicate column creation
--   â€¢ All 52 orders and 69 order_items are preserved with original data intact
-- =============================================================================

BEGIN;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SECTION A: public.orders â€” missing columns from migrations 007, 008, 015/016
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- A1. updated_at (migration 007)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill: set updated_at = created_at for existing rows that got DEFAULT now()
-- Use created_at as the truthful timestamp instead of the current moment.
UPDATE public.orders
SET updated_at = created_at
WHERE updated_at > created_at + interval '1 second'
   OR updated_at IS NULL;

-- A2. updated_at trigger function (idempotent via CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public._touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- A3. Indexes for polling and status filtering (migration 007)
CREATE INDEX IF NOT EXISTS orders_hotel_id_updated_at_idx
  ON public.orders (hotel_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS orders_status_updated_at_idx
  ON public.orders (status, updated_at DESC);

-- A4. order_number (migration 008)
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq
  START 10000;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text;

-- Trigger function to auto-assign order_number on INSERT
CREATE OR REPLACE FUNCTION public._order_number_set()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR btrim(NEW.order_number) = '' THEN
    NEW.order_number := 'DINE-' || nextval('public.orders_order_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_order_number ON public.orders;
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR btrim(NEW.order_number) = '')
  EXECUTE FUNCTION public._order_number_set();

-- Backfill existing 52 orders with stable reference numbers (oldest first)
DO $$
DECLARE
  v_row public.orders%ROWTYPE;
BEGIN
  FOR v_row IN
    SELECT * FROM public.orders
    WHERE order_number IS NULL OR btrim(order_number) = ''
    ORDER BY created_at ASC, id ASC
  LOOP
    UPDATE public.orders
       SET order_number = 'DINE-' || nextval('public.orders_order_number_seq')
     WHERE id = v_row.id;
  END LOOP;
END $$;

-- Add unique constraint (only safe after all rows have a value)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_number_unique;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number IS NULL OR btrim(order_number) = '') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
    ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_order_number_idx
  ON public.orders (order_number);

-- A5. Cancellation columns on orders (migration 015)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_by text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_source text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Indexes for cancelled order lookups (migration 015)
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_by_reason
  ON public.orders (cancelled_by, cancellation_reason)
  WHERE status = 'cancelled';

CREATE INDEX IF NOT EXISTS idx_orders_cancellation_source
  ON public.orders (cancellation_source)
  WHERE status = 'cancelled';

-- A6. Backfill cancellation metadata for already-cancelled orders (migration 016)
--     Uses created_at as the best available timestamp since updated_at was
--     just added and backfilled from created_at.
UPDATE public.orders
SET cancellation_source = 'customer',
    cancelled_by = 'customer',
    cancelled_at = COALESCE(updated_at, created_at)
WHERE status = 'cancelled'
  AND cancellation_source IS NULL
  AND cancelled_by IS NULL;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SECTION B: public.order_items â€” missing columns from migration 017
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- B1. Add cancellation tracking columns
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text;

-- B2. Backfill: all existing items are active (not cancelled)
UPDATE public.order_items
SET status = 'active'
WHERE status IS NULL;

-- B3. Composite index for faster item lookups by order + status
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_status
  ON public.order_items (order_id, status);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SECTION C: PostgREST schema cache refresh
-- Notifies PostgREST to reload its schema cache so the new columns are
-- immediately visible without a container restart.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (read-only â€” safe to run any time after applying)
-- =============================================================================

-- V1. Confirm order_items columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'order_items'
ORDER BY ordinal_position;

-- V2. Confirm orders new columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
  AND column_name IN (
    'updated_at', 'order_number',
    'cancellation_reason', 'cancelled_by', 'cancellation_source', 'cancelled_at'
  )
ORDER BY ordinal_position;

-- V3. Confirm row counts are unchanged
SELECT
  (SELECT count(*) FROM public.orders)       AS orders_count,
  (SELECT count(*) FROM public.order_items)  AS order_items_count;

-- V4. Sample order_number backfill
SELECT id, order_number, status, created_at
FROM public.orders
ORDER BY created_at ASC
LIMIT 5;

-- V5. Confirm no order_items rows lost status default
SELECT status, count(*)
FROM public.order_items
GROUP BY status;
