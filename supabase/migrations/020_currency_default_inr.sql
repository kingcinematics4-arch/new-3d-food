-- Migration 020: default restaurant currency to INR
--
-- Dine3D is built for the Indian F&B market. Every restaurant that has
-- not explicitly set a currency is now treated as INR (₹).
--
-- This migration only touches the `currency` display column. It does
-- NOT alter any numeric price, tax, service charge, payment or order
-- amount — those remain exactly as stored.
--
-- Existing rows that already have a currency (e.g. "USD ($)") are
-- left untouched so historical data and per-restaurant overrides are
-- preserved. Only rows where `currency` is NULL or empty are set to
-- the INR default.

BEGIN;

UPDATE public.hotels
SET currency = 'INR (₹)'
WHERE currency IS NULL
   OR btrim(currency) = '';

COMMIT;