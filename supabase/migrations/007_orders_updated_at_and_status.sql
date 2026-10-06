-- supabase/migrations/007_orders_updated_at_and_status.sql
-- Add updated_at to orders table, add trigger, and ensure status values are consistent

BEGIN;

-- 1. Add updated_at column to orders table if not exists
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Backfill updated_at for existing rows
UPDATE public.orders
SET updated_at = created_at
WHERE updated_at IS NULL OR updated_at = '1970-01-01 00:00:00+00';

-- 3. Create/update the updated_at trigger for orders
DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- 4. Add index on updated_at for efficient polling queries
CREATE INDEX IF NOT EXISTS orders_hotel_id_updated_at_idx
  ON public.orders (hotel_id, updated_at DESC);

-- 5. Add index on status for filtering
CREATE INDEX IF NOT EXISTS orders_status_updated_at_idx
  ON public.orders (status, updated_at DESC);

COMMIT;

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;