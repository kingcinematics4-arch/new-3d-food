-- supabase/migrations/026_service_requests_schema_cache_repair.sql
--
-- Safe repair for: "Could not find the table 'public.service_requests' in the schema cache."
-- Root causes addressed:
--   1) Migration 025 not applied to the target database (ensures objects exist).
--   2) PostgREST/Supabase schema cache stale after DDL (reloads cache).
-- Idempotent; does NOT drop/recreate tables or delete data.

begin;

CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  request_type text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_service_requests_hotel_status ON public.service_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_requests' AND policyname = 'service_requests_select_all'
  ) THEN
    CREATE POLICY service_requests_select_all ON public.service_requests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_requests' AND policyname = 'service_requests_insert_all'
  ) THEN
    CREATE POLICY service_requests_insert_all ON public.service_requests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'service_requests' AND policyname = 'service_requests_update_all'
  ) THEN
    CREATE POLICY service_requests_update_all ON public.service_requests FOR UPDATE USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi',
  transaction_id text,
  payer_name text,
  split_type text NOT NULL DEFAULT 'custom',
  split_details jsonb,
  status text NOT NULL DEFAULT 'successful',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_hotel ON public.order_payments(hotel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_transaction_unique ON public.order_payments(transaction_id) WHERE transaction_id IS NOT NULL;

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_payments' AND policyname = 'order_payments_select_all'
  ) THEN
    CREATE POLICY order_payments_select_all ON public.order_payments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_payments' AND policyname = 'order_payments_insert_all'
  ) THEN
    CREATE POLICY order_payments_insert_all ON public.order_payments FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_payments' AND policyname = 'order_payments_update_all'
  ) THEN
    CREATE POLICY order_payments_update_all ON public.order_payments FOR UPDATE USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN amount_paid numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'water_settings'
  ) THEN
    ALTER TABLE public.hotels ADD COLUMN water_settings jsonb DEFAULT '{
      "normal": { "enabled": true, "price": 0 },
      "mineral": { "enabled": true, "price": 20, "sizes": [{ "size": "500ml", "price": 10, "enabled": true }, { "size": "1L", "price": 20, "enabled": true }] },
      "cold": { "enabled": true, "price": 25, "sizes": [{ "size": "500ml", "price": 15, "enabled": true }, { "size": "1L", "price": 25, "enabled": true }] }
    }'::jsonb;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_payments TO anon, authenticated, service_role;

commit;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
