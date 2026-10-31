-- supabase/migrations/016_backfill_cancellation_source.sql
--
-- Backfill cancellation_source, cancelled_by, cancelled_at for existing cancelled orders
-- where possible. Only set values if columns exist.

DO $$
BEGIN
  -- If cancellation_source exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancellation_source'
  ) THEN
    -- Set from cancelled_by if available
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancelled_by'
    ) THEN
      UPDATE public.orders
      SET cancellation_source = 'customer'
      WHERE status = 'cancelled'
        AND cancellation_source IS NULL
        AND cancelled_by = 'customer';
      
      UPDATE public.orders
      SET cancellation_source = 'hotel'
      WHERE status = 'cancelled'
        AND cancellation_source IS NULL
        AND cancelled_by IN ('restaurant', 'hotel');
    END IF;
  END IF;

  -- Ensure cancelled_by is consistent if source is set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancelled_by'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancellation_source'
  ) THEN
    UPDATE public.orders
    SET cancelled_by = 'customer'
    WHERE status = 'cancelled'
      AND cancelled_by IS NULL
      AND cancellation_source = 'customer';
      
    UPDATE public.orders
    SET cancelled_by = 'restaurant'
    WHERE status = 'cancelled'
      AND cancelled_by IS NULL
      AND cancellation_source = 'hotel';
  END IF;

  -- Set cancelled_at if missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cancelled_at'
  ) THEN
    UPDATE public.orders
    SET cancelled_at = COALESCE(updated_at, created_at)
    WHERE status = 'cancelled'
      AND cancelled_at IS NULL;
  END IF;
END $$;
