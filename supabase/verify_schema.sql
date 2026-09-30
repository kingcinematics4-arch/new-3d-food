-- supabase/verify_schema.sql
--
-- Read-only verification for the Dine3D signup/database integration fix.
-- Run this in the Supabase SQL Editor AFTER applying, in order:
--   1) supabase/migrations/001_initial.sql
--   2) supabase/migrations/002_auth_identity_and_menu_fields.sql
--   3) supabase/policies.sql
--
-- Every query is read-only (SELECT only) and either returns rows or is empty;
-- any server error means the schema still needs fixing.

-- (1) Did hotels get the `name` column the app writes (legacy `restaurant_name`
--     should be gone, or both present mid-upgrade)?
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'hotels'
   AND column_name IN ('name', 'restaurant_name')
 ORDER BY column_name;

-- (2) All required tables present?
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('hotels','hotel_users','user_profiles','categories',
                      'menu_items','orders','order_items','order_status_history',
                      'reviews','qr_codes')
 ORDER BY table_name;

-- (3) Required hotels columns present?
SELECT column_name
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'hotels'
   AND column_name IN ('id','user_id','name','slug','email','location',
                       'is_active','subscription_plan','created_at','updated_at')
 ORDER BY column_name;

-- (4) One-hotel-per-owner and slug unique indexes present?
SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public' AND tablename = 'hotels'
   AND indexname IN ('hotels_user_id_unique','hotels_slug_unique')
 ORDER BY indexname;

-- (5) RLS enabled on every tenant table?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname IN ('hotels','hotel_users','categories','menu_items','orders',
                     'order_items','order_status_history','reviews','qr_codes')
 ORDER BY c.relname;

-- (6) RLS policies present for the tables the app depends on?
SELECT schemaname, tablename, policyname
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename IN ('hotels','hotel_users','categories','menu_items','orders','reviews')
 ORDER BY tablename, policyname;

-- (7) hotels.user_id actually references auth.users?
SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
 WHERE conrelid = 'public.hotels'::regclass
   AND contype = 'f'
 ORDER BY conname;

-- (8) Auth users that still own NO hotel (these need the manual repair below),
--     showing what signup metadata exists for each.
SELECT u.id,
       u.email,
       u.raw_user_meta_data ->> 'hotel_name' AS metadata_hotel_name,
       u.raw_user_meta_data ->> 'owner_name' AS metadata_owner_name,
       u.created_at
  FROM auth.users u
 WHERE NOT EXISTS (SELECT 1 FROM public.hotels h WHERE h.user_id = u.id)
 ORDER BY u.created_at;

-- (9) Hotels summary: totals, orphaned rows, unlinked rows.
SELECT count(*) AS hotels_total,
       count(*) FILTER (WHERE user_id IS NULL) AS hotels_without_owner,
       count(*) FILTER (WHERE id NOT IN (SELECT hotel_id FROM public.hotel_users)) AS hotels_without_link
  FROM public.hotels;

-- ---------------------------------------------------------------------------
-- MANUAL REPAIR (only for accounts listed by query (8) that have no `hotel_name`
-- metadata). Replace the two placeholders and run once:
--
--   WITH target AS (
--     SELECT id FROM auth.users WHERE email = '<REPLACE_WITH_EMAIL>' LIMIT 1
--   ), new_hotel AS (
--     INSERT INTO public.hotels
--       (user_id, name, slug, owner_name, email, is_active, subscription_plan)
--     SELECT t.id,
--            '<Display Name>',
--            lower(regexp_replace('<Display Name>', '[^a-z0-9]+', '-', 'ig'))
--              || '-' || left(md5(t.id::text), 6),
--            coalesce(u.raw_user_meta_data ->> 'owner_name', split_part(u.email, '@', 1)),
--            u.email,
--            true,
--            'starter'
--       FROM target t JOIN auth.users u ON u.id = t.id
--      WHERE NOT EXISTS (SELECT 1 FROM public.hotels h WHERE h.user_id = t.id)
--      RETURNING id
--   )
--   INSERT INTO public.hotel_users (user_id, hotel_id, role)
--   SELECT t.id, n.id, 'owner' FROM target t, new_hotel n;
-- ---------------------------------------------------------------------------
