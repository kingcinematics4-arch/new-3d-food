-- supabase/migrations/024_hotel_google_review_url.sql
--
-- Ensures `public.hotels.google_review_url` exists. This is the single
-- source of truth for the hotel's Google Review link used by the
-- dashboard Reviews settings and the customer order-tracking/payment
-- redirect flow.
--
-- Migration 001 declared this column via IF NOT EXISTS, but some deployed
-- databases may be missing it (manual/partial migration history). Without
-- it, saves are silently ineffective and the customer page reports
-- "Google Review link has not been configured for this hotel."
--
-- IDEMPOTENT / SAFE TO RE-RUN.
begin;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hotels'
      and column_name = 'google_review_url'
  ) then
    alter table public.hotels add column google_review_url text;
  end if;
end $$;

commit;

-- Verification (read-only):
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'hotels' and column_name = 'google_review_url';
