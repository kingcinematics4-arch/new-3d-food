-- Migration 022: normalize hotel subscription plans
-- Allowed values: BASIC, PRO, ULTRA, CUSTOM. Existing/null/legacy starter -> BASIC.
-- Additive/idempotent; preserves hotel IDs, passwords/auth, relationships, and data.

BEGIN;

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS subscription_plan text;

UPDATE public.hotels
SET subscription_plan = CASE
  WHEN subscription_plan IS NULL OR btrim(subscription_plan) = '' THEN 'BASIC'
  WHEN upper(btrim(subscription_plan)) = 'STARTER' THEN 'BASIC'
  WHEN upper(btrim(subscription_plan)) IN ('BASIC','PRO','ULTRA','CUSTOM') THEN upper(btrim(subscription_plan))
  ELSE 'BASIC'
END;

ALTER TABLE public.hotels
  ALTER COLUMN subscription_plan SET DEFAULT 'BASIC';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hotels_subscription_plan_check'
  ) THEN
    ALTER TABLE public.hotels
      ADD CONSTRAINT hotels_subscription_plan_check
      CHECK (subscription_plan IN ('BASIC','PRO','ULTRA','CUSTOM'));
  END IF;
END $$;

COMMIT;
