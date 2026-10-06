-- supabase/migrations/008_orders_order_number.sql
--
-- Adds a permanent, customer-facing reference number to public.orders.
--
-- WHY THIS EXISTS
--   The order tracking page must show a stable human-readable reference such as
--   DINE-10482. Before this migration the only identifier on an order was the
--   raw uuid `id`, which the requirements explicitly forbid exposing to diners.
--   The create route also generated a throwaway `ORD-XXXX` code in application
--   memory that was never stored, so a page refresh or the hotel dashboard could
--   never look the order up by reference.
--
-- FORMAT
--   DINE-<n>  where <n> is drawn from a dedicated SEQUENCE, so the numbers are
--   numeric, monotonically increasing and UNIQUE BY CONSTRUCTION. Existing rows
--   are backfilled in id order so older orders keep the smaller numbers.
--
-- WHAT THIS DOES (all idempotent, safe to re-run)
--   1. Creates `orders_order_number_seq` (START 10000) if absent.
--   2. Adds `order_number text` to public.orders.
--   3. Adds a BEFORE INSERT trigger that assigns the next sequence value when
--      the caller omits order_number.
--   4. Backfills every existing row in id order (oldest first).
--   5. Adds a UNIQUE constraint + NOT NULL, applied only once every row has a
--      value, so a partial backfill can never abort the migration.
--   6. Adds an index for fast lookup/sort by reference.
--
-- WHAT THIS NEVER DOES
--   * no DROP TABLE / TRUNCATE / DELETE
--   * no data invented for existing rows: every value comes from the SEQUENCE,
--     which is itself created by this migration
--   * does not touch order_items, menu_items, hotels or any other table
--   * does not modify auth.users or disable RLS
-- =====================================================================

BEGIN;

-- ------------------------------------------------------------------
-- 1. Sequence -- the single source of truth for reference numbers.
--    START 10000 so the first assigned number is DINE-10000.
-- ------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq
  START 10000;

-- ------------------------------------------------------------------
-- 2. Column
-- ------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text;

-- ------------------------------------------------------------------
-- 3. BEFORE INSERT trigger function -- fill order_number when omitted.
--    Defined BEFORE the trigger so CREATE TRIGGER parses cleanly.
-- ------------------------------------------------------------------
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

-- ------------------------------------------------------------------
-- 4. Backfill existing rows in id order (oldest first).
--    A plain UPDATE cannot call nextval, so drive it with a plpgsql loop.
-- ------------------------------------------------------------------
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

-- ------------------------------------------------------------------
-- 5. Unique constraint + NOT NULL (only when fully satisfied).
-- ------------------------------------------------------------------
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_number_unique;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number IS NULL) THEN
    EXECUTE 'ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL';
  END IF;
END $$;

-- ------------------------------------------------------------------
-- 6. Index so the hotel dashboard can filter/sort by reference quickly.
-- ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS orders_order_number_idx
  ON public.orders (order_number);

COMMIT;

-- ------------------------------------------------------------------
-- Verify (read-only, safe to run any time)
-- ------------------------------------------------------------------
SELECT id,
       order_number,
       status,
       created_at,
       updated_at
  FROM public.orders
 ORDER BY created_at DESC
 LIMIT 10;