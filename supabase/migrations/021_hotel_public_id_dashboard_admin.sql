-- Migration 021: unique immutable hotel public ID + dashboard admin session state
-- Additive/idempotent. Preserves existing hotel rows, relationships, and history.
--
-- hotel_public_id: format AA12bb123 (2 upper A-Z, 2 digits, 2 lower a-z, 3 digits)
-- Generated server-side at registration; never shown on public/customer pages.

BEGIN;

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS hotel_public_id text;

-- Uniqueness (NULLs allowed for legacy rows until backfilled; app enforces for new rows)
CREATE UNIQUE INDEX IF NOT EXISTS hotels_hotel_public_id_unique
  ON public.hotels (hotel_public_id)
  WHERE hotel_public_id IS NOT NULL;

-- Immutability: once set, hotel_public_id cannot change.
CREATE OR REPLACE FUNCTION public.prevent_hotel_public_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.hotel_public_id IS NOT NULL AND NEW.hotel_public_id IS DISTINCT FROM OLD.hotel_public_id THEN
    RAISE EXCEPTION 'hotel_public_id is immutable once assigned';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_hotel_public_id_change ON public.hotels;
CREATE TRIGGER trg_prevent_hotel_public_id_change
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_hotel_public_id_change();

-- Dashboard Admin session revocation state (separate from /admin owner panel).
CREATE TABLE IF NOT EXISTS public.dashboard_admin_session_state (
  id boolean PRIMARY KEY DEFAULT true,
  revoked_at timestamptz NULL,
  CONSTRAINT dashboard_admin_session_state_singleton CHECK (id = true)
);

INSERT INTO public.dashboard_admin_session_state (id, revoked_at)
VALUES (true, NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;
