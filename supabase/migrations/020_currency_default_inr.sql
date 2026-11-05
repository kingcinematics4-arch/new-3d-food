-- Migration 020: default restaurant currency to INR
--
// Dine3D is built for the Indian F&B market, so every restaurant is
// now treated as INR (₹). This migration updates the `currency`
// DISPLAY column only.
//
// FINANCIAL SAFETY:
//   - This migration NEVER touches numeric columns: price, subtotal,
//     tax, service_charge, total_amount, payment amounts, refunds or
//     historical order rows. Those remain byte-for-byte unchanged.
//   - No multiplication, division or conversion is performed. The
//     `currency` column is a display label, not a conversion factor.
//   - Payment gateway integration is unaffected: amounts are still
//     sent in the same units the provider expects.
//
// Existing rows that already use INR are left untouched. Rows that
// still carry the legacy USD default (or any other non-INR value)
// are switched to INR so the entire application renders ₹.

BEGIN;

UPDATE public.hotels
SET currency = 'INR (₹)'
WHERE currency IS NULL
   OR btrim(currency) = ''
   OR lower(currency) LIKE '%usd%'
   OR lower(currency) LIKE '%dollar%'
   OR lower(currency) = 'usd'
   OR lower(currency) = 'usd ($)'
   OR lower(currency) = 'usd($)'
   OR lower(currency) = '$'
   OR lower(currency) = ' dollar'
   OR lower(currency) = ' dollars';

COMMIT;