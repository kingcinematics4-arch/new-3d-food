-- supabase/verify_003_reconcile_app_schema.sql
--
-- READ-ONLY post-migration checks for 003_reconcile_app_schema.sql.
-- Run in the Supabase SQL Editor AFTER the migration and AFTER clicking
-- "Refresh schema cache".
--
-- Expected on the diagnosed starting state:
--   V1  10 tables
--   V2  every count 0  (hotels MUST stay 0 - the migration creates no hotel)
--   V3  name present, restaurant_name ABSENT, name NOT NULL
--   V4  15 foreign keys; reviews/order_item_id = ON DELETE SET NULL
--   V5  21 menu_items columns
--   V6  30 policies
--   V7  10 tables with RLS enabled
--   V8  0 rows (no blanket-access policy)
--   V10 16 app indexes
--   V11 10 primary keys
--   V13 all zeros

-- ==========================================================================
-- V1. EXPECTED: 10 tables
-- ==========================================================================
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
 ORDER BY table_name;

-- ==========================================================================
-- V2. Row counts. hotels MUST still be 0; everything MUST be 0.
-- ==========================================================================
SELECT 'hotels' AS table_name, count(*) AS rows FROM public.hotels
UNION ALL SELECT 'hotel_users',          count(*) FROM public.hotel_users
UNION ALL SELECT 'user_profiles',        count(*) FROM public.user_profiles
UNION ALL SELECT 'categories',           count(*) FROM public.categories
UNION ALL SELECT 'menu_items',           count(*) FROM public.menu_items
UNION ALL SELECT 'orders',               count(*) FROM public.orders
UNION ALL SELECT 'order_items',          count(*) FROM public.order_items
UNION ALL SELECT 'order_status_history', count(*) FROM public.order_status_history
UNION ALL SELECT 'reviews',              count(*) FROM public.reviews
UNION ALL SELECT 'qr_codes',             count(*) FROM public.qr_codes;

-- ==========================================================================
-- V3. restaurant_name -> name resolved? 24 columns expected.
-- ==========================================================================
SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'hotels'
 ORDER BY ordinal_position;

-- ==========================================================================
-- V4. Every foreign key that actually exists. EXPECT 15 ROWS.
--     pg_constraint.conname / conkey / confrelid / contype are the real
--     catalog columns.
-- ==========================================================================
SELECT c.conrelid::regclass  AS child_table,
       a.attname             AS child_column,
       c.confrelid::regclass AS parent_table,
       pg_get_constraintdef(c.oid) AS definition
  FROM pg_constraint c
  JOIN pg_class t      ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  JOIN pg_attribute a  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
 WHERE n.nspname = 'public' AND c.contype = 'f'
 ORDER BY c.conrelid::regclass::text, a.attname;

-- ==========================================================================
-- V5. menu_items: EXPECT 21 columns (19 written by POST /api/menu + id
--     + created_at).
-- ==========================================================================
SELECT count(*) AS menu_items_column_count,
       string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'menu_items';

-- ==========================================================================
-- V6. SECURITY AUDIT - full policy inventory. EXPECT 30 ROWS.
--     pg_policy exposes polname / polcmd / polqual.
-- ==========================================================================
SELECT c.relname AS table_name,
       p.polname AS policy_name,
       CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                     WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
                     ELSE 'ALL' END AS command
  FROM pg_policy p
  JOIN pg_class c      ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
 ORDER BY c.relname, p.polname;

-- ==========================================================================
-- V7. RLS enabled everywhere. EXPECT 10 ROWS, all true.
-- ==========================================================================
SELECT c.relname, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
 ORDER BY c.relname;

-- ==========================================================================
-- V8. Confirm no blanket-access policy remains. EXPECT 0 ROWS.
--     The USING expression lives in pg_policy.polqual.
-- ==========================================================================
SELECT c.relname AS table_name, p.polname AS policy_name, p.polqual
  FROM pg_policy p
  JOIN pg_class c      ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND (p.polqual ILIKE '%= true%'
        OR p.polqual ILIKE '%auth.uid() IS NULL%'
        OR (p.polqual IS NOT NULL AND btrim(p.polqual) = 'true'));

-- ==========================================================================
-- V9. Read orders_select USING expression; confirm no `OR true`.
-- ==========================================================================
SELECT pg_get_expr(p.polqual, p.polrelid) AS orders_select_using
  FROM pg_policy p
  JOIN pg_class c      ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relname = 'orders' AND p.polname = 'orders_select';

-- ==========================================================================
-- V10. Indexes. EXPECT 16 app indexes (pkey excluded).
-- ==========================================================================
SELECT indexname
  FROM pg_indexes
 WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
 ORDER BY indexname;

-- ==========================================================================
-- V11. Primary keys. EXPECT 10 ROWS (hotel_users shows the composite key).
-- ==========================================================================
SELECT c.relname AS table_name, pg_get_constraintdef(k.oid) AS pk
  FROM pg_constraint k
  JOIN pg_class c      ON c.oid = k.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND k.contype = 'p'
 ORDER BY c.relname;

-- ==========================================================================
-- V12. Legacy hotels.password -- READ ONLY. Expected: 0 rows (this
--     migration neither creates nor drops that column).
-- ==========================================================================
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'hotels'
   AND column_name = 'password';

-- ==========================================================================
-- V13. Orphan / null report. EXPECT all zeros on the current state.
-- ==========================================================================
SELECT 'menu_items.hotel_id NULL' AS check_name, count(*) AS n  FROM public.menu_items WHERE hotel_id IS NULL
UNION ALL SELECT 'categories.hotel_id NULL', count(*)
  FROM public.categories WHERE hotel_id IS NULL
UNION ALL SELECT 'orders.hotel_id NULL', count(*)
  FROM public.orders WHERE hotel_id IS NULL
UNION ALL SELECT 'order_items.order_id NULL', count(*)
  FROM public.order_items WHERE order_id IS NULL
UNION ALL SELECT 'order_status.order_id NULL', count(*)
  FROM public.order_status_history WHERE order_id IS NULL
UNION ALL SELECT 'menu_items.category_id orphan', count(*)
  FROM public.menu_items m
 WHERE m.category_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.id = m.category_id)
UNION ALL SELECT 'reviews.hotel_id NULL', count(*)
  FROM public.reviews WHERE hotel_id IS NULL
UNION ALL SELECT 'reviews nil-uuid order_item', count(*)
  FROM public.reviews
 WHERE order_item_id = '00000000-0000-0000-0000-000000000000';

-- ==========================================================================
-- V14. Owner-link integrity: every hotel must be reachable by auth.uid().
--     After you complete onboarding there should be exactly 1 row, whose
--     user_id matches the signed-in account in auth.users.
-- ==========================================================================
SELECT h.id, h.name, h.slug, h.user_id, h.is_active,
       (SELECT count(*) FROM public.hotel_users hu
         WHERE hu.hotel_id = h.id AND hu.user_id = h.user_id) AS owner_links
  FROM public.hotels h
 ORDER BY h.created_at;