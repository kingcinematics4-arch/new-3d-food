-- supabase/migrations/003_reconcile_app_schema.sql
--
-- TARGET STATE (verified read-only against sqfuoqmmaorjxlleggfu):
--   * public schema contained ONLY public.hotels, legacy shape:
--     id, user_id, restaurant_name, owner_name, slug, created_at,
--     updated_at, email, location, address, city
--   * public.hotels had ZERO ROWS
--   * hotel_users, user_profiles, categories, menu_items, orders,
--     order_items, order_status_history, reviews, qr_codes DID NOT EXIST
--   * auth.users had rows and is never modified
--
-- WHAT THIS DOES
--   * renames hotels.restaurant_name -> hotels.name (the column the app writes)
--   * adds every hotels column the current app reads/writes
--   * creates the 9 missing tables
--   * adds primary keys, foreign keys and indexes
--   * enables RLS and (re)creates the policies
--
-- WHAT THIS NEVER DOES
--   * no INSERT of a hotels / categories / menu_items / demo row
--   * no DROP TABLE, no TRUNCATE, no DELETE
--   * no UPDATE that invents a value: every written value is read from the DB
--   * never modifies auth.users
--   * 001_initial.sql:275-285 is deliberately NOT reproduced, because it
--     fabricates a hotels row for every auth user that lacks one
--
-- IDEMPOTENT. Safe to run in the Supabase SQL Editor. Afterwards click
-- "Refresh schema cache" so PostgREST picks up the new relations.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. PRE-FLIGHT DIAGNOSTICS  (read-only, RAISE NOTICE only)
--     pg_policy exposes polname / polcmd / polqual, never proname / cmd.
-- =====================================================================

DO $$
DECLARE v bigint;
BEGIN
  IF to_regclass('public.hotels') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='hotels' AND column_name='restaurant_name')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='hotels' AND column_name='name') THEN
      RAISE NOTICE 'PRE-FLIGHT: hotels.restaurant_name will be RENAMEd to hotels.name.';
    END IF;

    EXECUTE 'SELECT count(*) FROM public.hotels' INTO v;
    RAISE NOTICE 'PRE-FLIGHT: public.hotels currently has % row(s).', v;

    IF v > 0 THEN
      EXECUTE 'SELECT count(*) FROM (SELECT user_id FROM public.hotels WHERE user_id IS NOT NULL
                                      GROUP BY user_id HAVING count(*) > 1) x' INTO v;
      IF v > 0 THEN RAISE NOTICE 'WARNING: % duplicate hotels.user_id -- hotels_user_id_unique SKIPPED.', v; END IF;

      EXECUTE 'SELECT count(*) FROM (SELECT slug FROM public.hotels WHERE slug IS NOT NULL
                                      GROUP BY slug HAVING count(*) > 1) x' INTO v;
      IF v > 0 THEN RAISE NOTICE 'WARNING: % duplicate hotels.slug -- hotels_slug_unique SKIPPED.', v; END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='hotels' AND column_name='password') THEN
      RAISE NOTICE 'NOTE: legacy hotels.password exists. NOT touched by this script.';
    END IF;
  ELSE
    RAISE NOTICE 'PRE-FLIGHT: public.hotels does not exist -- it will be created empty.';
  END IF;

  SELECT count(*) INTO v
    FROM pg_policy p
    JOIN pg_class c      ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND p.polname NOT IN (
       'hotel_insert','hotel_select','hotel_update','hotel_delete',
       'hotel_users_select','hotel_users_insert','hotel_users_update','hotel_users_delete',
       'user_profiles_select','user_profiles_insert','user_profiles_update',
       'categories_select','categories_manage','menu_items_select','menu_items_manage',
       'orders_insert','orders_select','orders_update','orders_delete',
       'order_items_insert','order_items_select','order_items_update',
       'order_status_history_insert','order_status_history_select',
       'reviews_insert','reviews_select','reviews_update','reviews_delete',
       'qr_codes_select','qr_codes_manage');
  IF v > 0 THEN
    RAISE NOTICE 'SECURITY: % pre-existing RLS polic(y/ies) not managed by this script remain ACTIVE.', v;
  END IF;
EXCEPTION WHEN others THEN
  RAISE WARNING 'pre-flight incomplete: %', SQLERRM;
END $$;

-- =====================================================================
-- 2. PERSISTENT POLICY HELPERS
--    SECURITY DEFINER so the tenant checks used inside RLS policies are not
--    themselves blocked by hotels' own RLS. Pinned search_path; every
--    reference inside is schema-qualified, so auth.uid()/auth.role() resolve.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.hotel_is_active(p_hotel_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.hotels h
                  WHERE h.id = p_hotel_id AND h.is_active IS TRUE);
$$;

CREATE OR REPLACE FUNCTION public.user_owns_hotel(p_hotel_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = p_hotel_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = p_hotel_id AND hu.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.order_hotel_id(p_order_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT o.hotel_id FROM public.orders o WHERE o.id = p_order_id;
$$;

CREATE OR REPLACE FUNCTION public.menu_item_hotel_id(p_menu_item_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
  SELECT m.hotel_id FROM public.menu_items m WHERE m.id = p_menu_item_id;
$$;

-- =====================================================================
-- 3. TRANSIENT DDL HELPERS  (dropped before COMMIT)
-- =====================================================================

-- Add a FK if the column has none. Orphan-checked first; never fatal.
-- p_ref_table MUST be schema-qualified ("auth.users", "public.hotels").
CREATE OR REPLACE FUNCTION public._fix_ensure_fk(
  p_table text, p_column text, p_ref_table text, p_ref_col text,
  p_on_delete text DEFAULT 'NO ACTION', p_replace boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_name    text;
  v_ok      boolean;
  v_orphans bigint;
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN
    RAISE NOTICE 'skip FK %.%: table missing', p_table, p_column;
    RETURN;
  END IF;

  -- Guard the raw identifier interpolation below.
  IF p_ref_table !~ '^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$' THEN
    RAISE WARNING 'skip FK %.%: p_ref_table "%" is not schema-qualified',
      p_table, p_column, p_ref_table;
    RETURN;
  END IF;
  IF p_on_delete NOT IN ('CASCADE','SET NULL','SET DEFAULT','RESTRICT','NO ACTION') THEN
    RAISE WARNING 'skip FK %.%: invalid ON DELETE "%"', p_table, p_column, p_on_delete;
    RETURN;
  END IF;

  SELECT MIN(c.conname),
         bool_or(pg_get_constraintdef(c.oid)
        ILIKE '%on delete ' || upper(p_on_delete) || '%')
    INTO v_name, v_ok
    FROM pg_constraint c
    JOIN pg_class t      ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class rt     ON rt.oid = c.confrelid
   WHERE n.nspname = 'public'
     AND t.relname = p_table
     AND c.contype = 'f'
     AND rt.relname = split_part(p_ref_table, '.', 2)
     AND rt.relnamespace = to_regnamespace(split_part(p_ref_table, '.', 1))
     AND c.conkey = ARRAY[(SELECT a.attnum FROM pg_attribute a
                             JOIN pg_class t2     ON t2.oid = a.attrelid
                             JOIN pg_namespace n2 ON n2.oid = t2.relnamespace
                            WHERE n2.nspname = 'public'
                              AND t2.relname = p_table
                              AND a.attname = p_column)]::smallint[];

  IF v_name IS NOT NULL THEN
    IF p_replace AND NOT COALESCE(v_ok, false) THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, v_name);
      RAISE NOTICE 'replaced FK %.% with ON DELETE %', p_table, p_column, p_on_delete;
    ELSE
      RETURN;
    END IF;
  END IF;

  -- Orphan pre-check, so a blocked constraint is reported instead of failing.
  BEGIN
    EXECUTE format(
      'SELECT count(*) FROM public.%I t WHERE t.%I IS NOT NULL'
      ' AND NOT EXISTS (SELECT 1 FROM %s r WHERE r.%I = t.%I)',
      p_table, p_column, p_ref_table, p_ref_col, p_column)
    INTO v_orphans;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'orphan pre-check failed for %.% -> %: %',
      p_table, p_column, p_ref_table, SQLERRM;
    RETURN;
  END;

  IF v_orphans > 0 THEN
    RAISE WARNING 'NOT adding FK %.% -> %.%: % orphan row(s) would violate it.',
      p_table, p_column, p_ref_table, v_orphans;
    RETURN;
  END IF;

  BEGIN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE %s',
      p_table, p_table || '_' || p_column || '_fkey', p_column,
      p_ref_table, p_ref_col, p_on_delete);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'could not add FK %.% -> %.%: %', p_table, p_column, p_ref_table, SQLERRM;
  END;
END $$;

-- Ensure a single-column PK on `id` plus a default for it. Returns early for
-- hotel_users, which has a composite PK and no `id` column.
CREATE OR REPLACE FUNCTION public._fix_ensure_pk(p_table text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute
                  WHERE attrelid = to_regclass('public.' || p_table) AND attname = 'id') THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE contype = 'p' AND conrelid = to_regclass('public.' || p_table)) THEN
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (id)',
        p_table, p_table || '_pkey');
    EXCEPTION WHEN others THEN
      RAISE WARNING 'could not add PK on public.%: %', p_table, SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_attribute
                  WHERE attrelid = to_regclass('public.' || p_table)
                    AND attname = 'id' AND atthasdef) THEN
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', p_table);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'could not set id default on public.%: %', p_table, SQLERRM;
    END;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._fix_index(p_name text, p_sql text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass('public.' || p_name) IS NOT NULL THEN RETURN; END IF;
  BEGIN    EXECUTE p_sql;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'could not create index %: %', p_name, SQLERRM;
  END;
END $$;

-- Set NOT NULL ONLY when the column already has zero NULL rows. Never writes.
CREATE OR REPLACE FUNCTION public._fix_tighten(p_table text, p_column text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE v_nulls bigint; v_notnull text;
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN RETURN; END IF;
  SELECT a.attnotnull INTO v_notnull FROM pg_attribute a
   WHERE a.attrelid = to_regclass('public.' || p_table) AND a.attname = p_column;
  IF v_notnull IS NULL OR v_notnull THEN RETURN; END IF;

  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NULL', p_table, p_column) INTO v_nulls;
  IF v_nulls > 0 THEN
    RAISE NOTICE '%.% has % NULL row(s) -- left nullable, NOT NULL NOT applied (no data invented).',
      p_table, p_column, v_nulls;
    RETURN;
  END IF;
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', p_table, p_column);
END $$;

-- =====================================================================
-- 4. HOTELS RECONCILIATION  --  restaurant_name -> name
--    The app writes `name` (lib/auth.ts, app/api/hotel/update/route.ts,
--    lib/useHotel.ts Hotel, lib/serverAuth.ts HotelRecord).
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='hotels' AND column_name='restaurant_name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='hotels' AND column_name='name') THEN
    ALTER TABLE public.hotels RENAME COLUMN restaurant_name TO name;
    RAISE NOTICE 'renamed hotels.restaurant_name -> hotels.name (values preserved)';
  END IF;
END $$;

-- Every hotels column the current application reads or writes.
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name              text,
  ADD COLUMN IF NOT EXISTS slug              text,
  ADD COLUMN IF NOT EXISTS owner_name        text,
  ADD COLUMN IF NOT EXISTS email             text,
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS city              text,
  ADD COLUMN IF NOT EXISTS address           text,
  ADD COLUMN IF NOT EXISTS location          text,
  ADD COLUMN IF NOT EXISTS logo_url          text,
  ADD COLUMN IF NOT EXISTS primary_color     text DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS secondary_color   text DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS menu_style        text DEFAULT 'cards',
  ADD COLUMN IF NOT EXISTS card_style        text DEFAULT 'glassmorphic',
  ADD COLUMN IF NOT EXISTS dark_mode         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS typography        text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS welcome_text      text DEFAULT 'Experience our menu in 3D!',
  ADD COLUMN IF NOT EXISTS custom_domain     text,
  ADD COLUMN IF NOT EXISTS currency          text DEFAULT 'USD ($)',
  ADD COLUMN IF NOT EXISTS tax_rate          numeric(5,2) DEFAULT 8.875,
  ADD COLUMN IF NOT EXISTS service_charge    numeric(5,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS is_active         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS created_at        timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz NOT NULL DEFAULT now();

-- hotels.password is INTENTIONALLY LEFT ALONE: the application never reads or
-- writes it (credentials live in Supabase Auth). Removing it is a separate,
-- deliberate decision.

-- id / user_id must be uuid for the child FKs and the auth.users FK.
DO $$
DECLARE v_type text;
BEGIN
  SELECT a.atttypid::regtype::text INTO v_type
    FROM pg_attribute a
   WHERE a.attrelid = to_regclass('public.hotels') AND a.attname = 'id';
  IF v_type IN ('text','character varying') THEN
    BEGIN      ALTER TABLE public.hotels ALTER COLUMN id TYPE uuid USING NULLIF(btrim(id),'')::uuid;
      RAISE NOTICE 'hotels.id converted text -> uuid';
    EXCEPTION WHEN others THEN
      RAISE WARNING 'hotels.id is % and could not convert to uuid (%). Child FKs SKIPPED.', v_type, SQLERRM;
    END;
  ELSIF v_type IS NOT NULL AND v_type <> 'uuid' THEN
    RAISE WARNING 'hotels.id is type %, not uuid. All child FKs SKIPPED.', v_type;
  END IF;
END $$;

DO $$
DECLARE v_type text;
BEGIN
  SELECT a.atttypid::regtype::text INTO v_type
    FROM pg_attribute a
   WHERE a.attrelid = to_regclass('public.hotels') AND a.attname = 'user_id';
  IF v_type IN ('text','character varying') THEN
    BEGIN
      ALTER TABLE public.hotels ALTER COLUMN user_id TYPE uuid USING NULLIF(btrim(user_id),'')::uuid;
      RAISE NOTICE 'hotels.user_id converted text -> uuid';
    EXCEPTION WHEN others THEN
      RAISE WARNING 'hotels.user_id could not convert to uuid (%). FK to auth.users SKIPPED.', SQLERRM;
    END;
  END IF;
END $$;

-- =====================================================================
-- 5. TABLES  (created only when absent -- nothing is overwritten)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.hotels (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  slug              text,
  owner_name        text,
  email             text,
  phone             text,
  city              text,
  address           text,
  location          text,
  logo_url          text,
  primary_color     text DEFAULT '#f59e0b',
  secondary_color   text DEFAULT '#10b981',
  menu_style        text DEFAULT 'cards',
  card_style        text DEFAULT 'glassmorphic',
  dark_mode         boolean DEFAULT true,
  typography        text DEFAULT 'Inter',
  welcome_text      text DEFAULT 'Experience our menu in 3D!',
  custom_domain     text,
  currency          text DEFAULT 'USD ($)',
  tax_rate          numeric(5,2) DEFAULT 8.875,
  service_charge    numeric(5,2) DEFAULT 5.0,
  is_active         boolean DEFAULT true,
  subscription_plan text DEFAULT 'starter',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hotel_users (
  user_id  uuid NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  role     text DEFAULT 'owner',
  PRIMARY KEY (user_id, hotel_id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name       text NOT NULL,
  position   integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The 19 keys written by POST /api/menu, plus id and created_at for
-- `.order('created_at', { ascending: false })`. The category_id FK is what lets
-- GET /api/menu resolve its `categories ( name )` embed.
CREATE TABLE IF NOT EXISTS public.menu_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id              uuid NOT NULL REFERENCES public.hotels(id)   ON DELETE CASCADE,
  category_id           uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name                  text NOT NULL,
  description           text,
  price                 numeric(10,2) NOT NULL,
  image_url             text,
  model_url_glb         text,
  model_url_usdz        text,
  is_available          boolean DEFAULT true,
  is_featured           boolean DEFAULT false,
  is_popular            boolean DEFAULT false,
  is_veg                boolean DEFAULT true,
  allergens             text[] DEFAULT '{}',
  rating                numeric(3,2) DEFAULT 0,
  order_count           integer DEFAULT 0,
  dietary_tags          text[] DEFAULT '{}',
  calories              integer,
  preparation_time_mins integer,
  ingredients           text[] DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  customer_name  text,
  customer_phone text,
  table_number   text,
  notes          text,
  status         text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text NOT NULL DEFAULT 'pay_at_table',
  subtotal       numeric(10,2) DEFAULT 0,
  tax            numeric(10,2) DEFAULT 0,
  service_charge numeric(10,2) DEFAULT 0,
  total_amount   numeric(10,2) NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES public.orders(id)    ON DELETE CASCADE,
  menu_item_id  uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity      integer NOT NULL DEFAULT 1,
  price_at_time numeric(10,2) NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     text NOT NULL,
  note       text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id  uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  hotel_id       uuid REFERENCES public.hotels(id)     ON DELETE CASCADE,
  menu_item_name text,
  table_number   text,
  rating         integer,
  comment        text,
  customer_name  text DEFAULT 'Guest Diner',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  target_url   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. ADD MISSING COLUMNS ON THE NON-HOTELS TABLES (no-ops when fresh)
-- =====================================================================

ALTER TABLE public.hotel_users
  ADD COLUMN IF NOT EXISTS user_id  uuid REFERENCES auth.users(id)  ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role     text DEFAULT 'owner';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name  text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS hotel_id   uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name       text,
  ADD COLUMN IF NOT EXISTS position   integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS hotel_id              uuid REFERENCES public.hotels(id)     ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category_id           uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name                  text,
  ADD COLUMN IF NOT EXISTS description           text,
  ADD COLUMN IF NOT EXISTS price                 numeric(10,2),
  ADD COLUMN IF NOT EXISTS image_url             text,
  ADD COLUMN IF NOT EXISTS model_url_glb         text,
  ADD COLUMN IF NOT EXISTS model_url_usdz        text,
  ADD COLUMN IF NOT EXISTS is_available          boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_popular            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_veg                boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allergens             text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating                numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count           integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dietary_tags          text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS calories              integer,
  ADD COLUMN IF NOT EXISTS preparation_time_mins integer,
  ADD COLUMN IF NOT EXISTS ingredients           text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at            timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS hotel_id       uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS customer_name  text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS table_number   text,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pay_at_table',
  ADD COLUMN IF NOT EXISTS subtotal       numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax            numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_charge numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount   numeric(10,2),
  ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS order_id      uuid REFERENCES public.orders(id)    ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS menu_item_id  uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity      integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_at_time numeric(10,2),
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.order_status_history
  ADD COLUMN IF NOT EXISTS order_id   uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status     text,
  ADD COLUMN IF NOT EXISTS note       text,
  ADD COLUMN IF NOT EXISTS changed_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_item_id  uuid REFERENCES public.order_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hotel_id       uuid REFERENCES public.hotels(id)     ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS menu_item_name text,
  ADD COLUMN IF NOT EXISTS table_number   text,
  ADD COLUMN IF NOT EXISTS rating         integer,
  ADD COLUMN IF NOT EXISTS comment        text,
  ADD COLUMN IF NOT EXISTS customer_name  text DEFAULT 'Guest Diner',
  ADD COLUMN IF NOT EXISTS created_at     timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS hotel_id     uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS table_number text,
  ADD COLUMN IF NOT EXISTS target_url   text,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

-- =====================================================================
-- 7. REAL-DATA REPAIRS  (every written value is read from the database)
--    On the diagnosed state (zero rows) every statement is a no-op.
-- =====================================================================

-- Only when both columns exist (the rename above already handles the usual case).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema='public' AND table_name='hotels' AND column_name='restaurant_name') THEN
    UPDATE public.hotels h
       SET name = h.restaurant_name
     WHERE h.name IS NULL AND h.restaurant_name IS NOT NULL
       AND btrim(h.restaurant_name) <> '';
    RAISE NOTICE 'backfilled hotels.name from hotels.restaurant_name where name was NULL';
  END IF;
END $$;

-- menu_items.hotel_id <- its category's hotel
UPDATE public.menu_items m SET hotel_id = c.hotel_id
  FROM public.categories c
 WHERE m.category_id = c.id AND m.hotel_id IS NULL AND c.hotel_id IS NOT NULL;

-- menu_items.hotel_id <- an order that contains it
UPDATE public.menu_items m
   SET hotel_id = o.hotel_id
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
 WHERE oi.menu_item_id = m.id AND m.hotel_id IS NULL AND o.hotel_id IS NOT NULL;

-- orders.hotel_id <- the hotel of a dish on that order
UPDATE public.orders o
   SET hotel_id = m.hotel_id
  FROM public.order_items oi
  JOIN public.menu_items m ON m.id = oi.menu_item_id
 WHERE oi.order_id = o.id AND o.hotel_id IS NULL AND m.hotel_id IS NOT NULL;

-- reviews.hotel_id / table_number <- the order chain
UPDATE public.reviews r
   SET hotel_id     = o.hotel_id,
       table_number = o.table_number
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
 WHERE oi.id = r.order_item_id AND r.hotel_id IS NULL;

-- hotels.user_id <- existing owner link
UPDATE public.hotels h
   SET user_id = hu.user_id
  FROM public.hotel_users hu
 WHERE hu.hotel_id = h.id AND h.user_id IS NULL AND hu.role = 'owner';

-- Link hotels that already have an owner but no membership row.
INSERT INTO public.hotel_users (user_id, hotel_id, role)
SELECT h.user_id, h.id, 'owner'
  FROM public.hotels h
 WHERE h.user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.hotel_users hu
                    WHERE hu.user_id = h.user_id AND hu.hotel_id = h.id);

-- No slug, name, price, status or total is ever generated.
-- order_items.order_id / order_status_history.order_id orphans are left as-is.

-- =====================================================================
-- 8. NOT NULL / PRIMARY KEYS  (applied only when already satisfied)
-- =====================================================================

SELECT public._fix_tighten('hotels',      'name');
SELECT public._fix_tighten('categories',  'hotel_id');
SELECT public._fix_tighten('categories',  'name');
SELECT public._fix_tighten('menu_items',  'hotel_id');
SELECT public._fix_tighten('menu_items',  'name');
SELECT public._fix_tighten('menu_items',  'price');
SELECT public._fix_tighten('orders',      'hotel_id');
SELECT public._fix_tighten('orders',      'status');
SELECT public._fix_tighten('orders',      'payment_status');
SELECT public._fix_tighten('orders',      'payment_method');
SELECT public._fix_tighten('orders',      'total_amount');
SELECT public._fix_tighten('order_items', 'order_id');
SELECT public._fix_tighten('order_items', 'quantity');
SELECT public._fix_tighten('order_items', 'price_at_time');
SELECT public._fix_tighten('order_status_history', 'order_id');
SELECT public._fix_tighten('order_status_history', 'status');
SELECT public._fix_tighten('qr_codes',    'hotel_id');
SELECT public._fix_tighten('qr_codes',    'table_number');
SELECT public._fix_tighten('qr_codes',    'target_url');
SELECT public._fix_tighten('hotel_users', 'user_id');
SELECT public._fix_tighten('hotel_users', 'hotel_id');
SELECT public._fix_tighten('user_profiles', 'id');

SELECT public._fix_ensure_pk('hotels');
SELECT public._fix_ensure_pk('hotel_users');
SELECT public._fix_ensure_pk('user_profiles');
SELECT public._fix_ensure_pk('categories');
SELECT public._fix_ensure_pk('menu_items');
SELECT public._fix_ensure_pk('orders');
SELECT public._fix_ensure_pk('order_items');
SELECT public._fix_ensure_pk('order_status_history');
SELECT public._fix_ensure_pk('reviews');
SELECT public._fix_ensure_pk('qr_codes');

-- Composite-PK fallback for hotel_users.
DO $$
BEGIN
  IF to_regclass('public.hotel_users') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE contype = 'p' AND conrelid = to_regclass('public.hotel_users')) THEN
    BEGIN
      ALTER TABLE public.hotel_users
        ADD CONSTRAINT hotel_users_pkey PRIMARY KEY (user_id, hotel_id);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'hotel_users composite PK: %', SQLERRM;
    END;
  END IF;
END $$;

-- =====================================================================
-- 9. FOREIGN KEYS  (orphan-checked first; skipped + warned, never fatal)
--     p_ref_table is always schema-qualified.
-- =====================================================================

SELECT public._fix_ensure_fk('hotels',       'user_id',      'auth.users',        'id', 'CASCADE');
SELECT public._fix_ensure_fk('hotel_users',  'user_id',      'auth.users',        'id', 'CASCADE');
SELECT public._fix_ensure_fk('hotel_users',  'hotel_id',     'public.hotels',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('user_profiles','id',           'auth.users',        'id', 'CASCADE');
SELECT public._fix_ensure_fk('categories',   'hotel_id',     'public.hotels',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('menu_items',   'hotel_id',     'public.hotels',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('menu_items',   'category_id',  'public.categories', 'id', 'SET NULL');
SELECT public._fix_ensure_fk('orders',       'hotel_id',     'public.hotels',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('order_items',  'order_id',     'public.orders',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('order_items',  'menu_item_id', 'public.menu_items', 'id', 'SET NULL');
SELECT public._fix_ensure_fk('order_status_history','order_id','public.orders',   'id', 'CASCADE');
SELECT public._fix_ensure_fk('reviews',      'hotel_id',     'public.hotels',     'id', 'CASCADE');
SELECT public._fix_ensure_fk('qr_codes',     'hotel_id',     'public.hotels',     'id', 'CASCADE');

-- reviews.order_item_id stays ON DELETE SET NULL: deleting an order line must
-- not destroy a customer's written review.
SELECT public._fix_ensure_fk('reviews', 'order_item_id', 'public.order_items', 'id', 'SET NULL', true);

-- reviews.rating range check, added only if existing rows already comply.
DO $$
BEGIN
  IF to_regclass('public.reviews') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conrelid = to_regclass('public.reviews')
                        AND conname  = 'reviews_rating_check') THEN
    IF NOT EXISTS (SELECT 1 FROM public.reviews
                    WHERE rating IS NOT NULL AND (rating < 1 OR rating > 5)) THEN
      ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_rating_check
        CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
    ELSE
      RAISE NOTICE 'reviews contains out-of-range ratings; reviews_rating_check NOT added.';
    END IF;
  END IF;
END $$;

-- =====================================================================
-- 10. INDEXES  (one per .eq() / .order() in the application)
-- =====================================================================

SELECT public._fix_index('hotels_user_id_unique',
  'CREATE UNIQUE INDEX IF NOT EXISTS hotels_user_id_unique ON public.hotels (user_id) WHERE user_id IS NOT NULL');
SELECT public._fix_index('hotels_slug_unique',
  'CREATE UNIQUE INDEX IF NOT EXISTS hotels_slug_unique ON public.hotels (slug) WHERE slug IS NOT NULL');
SELECT public._fix_index('hotels_is_active_idx',
  'CREATE INDEX IF NOT EXISTS hotels_is_active_idx ON public.hotels (is_active)');
SELECT public._fix_index('hotel_users_hotel_id_idx',
  'CREATE INDEX IF NOT EXISTS hotel_users_hotel_id_idx ON public.hotel_users (hotel_id)');
SELECT public._fix_index('categories_hotel_id_idx',
  'CREATE INDEX IF NOT EXISTS categories_hotel_id_idx ON public.categories (hotel_id, position)');
SELECT public._fix_index('menu_items_hotel_id_idx',
  'CREATE INDEX IF NOT EXISTS menu_items_hotel_id_idx ON public.menu_items (hotel_id, created_at DESC)');
SELECT public._fix_index('menu_items_category_id_idx',
  'CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items (category_id)');
SELECT public._fix_index('orders_hotel_id_created_at_idx',
  'CREATE INDEX IF NOT EXISTS orders_hotel_id_created_at_idx ON public.orders (hotel_id, created_at DESC)');
SELECT public._fix_index('orders_status_idx',
  'CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status)');
SELECT public._fix_index('order_items_order_id_idx',
  'CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id)');
SELECT public._fix_index('order_items_menu_item_id_idx',
  'CREATE INDEX IF NOT EXISTS order_items_menu_item_id_idx ON public.order_items (menu_item_id)');
SELECT public._fix_index('order_status_history_order_id_idx',
  'CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON public.order_status_history (order_id, changed_at DESC)');
SELECT public._fix_index('reviews_hotel_id_created_at_idx',
  'CREATE INDEX IF NOT EXISTS reviews_hotel_id_created_at_idx ON public.reviews (hotel_id, created_at DESC)');
SELECT public._fix_index('reviews_order_item_id_idx',
  'CREATE INDEX IF NOT EXISTS reviews_order_item_id_idx ON public.reviews (order_item_id)');
SELECT public._fix_index('qr_codes_hotel_id_idx',
  'CREATE INDEX IF NOT EXISTS qr_codes_hotel_id_idx ON public.qr_codes (hotel_id)');

-- =====================================================================
-- 11. updated_at TRIGGER
-- =====================================================================

CREATE OR REPLACE FUNCTION public._touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS hotels_touch_updated_at ON public.hotels;
CREATE TRIGGER hotels_touch_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- =====================================================================
-- 12. ROW LEVEL SECURITY
--     Every application read/write goes through supabaseAdmin (service_role,
--     BYPASSRLS), so these policies do not change app behaviour. They protect
--     the anon/authenticated keys.
-- =====================================================================

ALTER TABLE public.hotels               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes             ENABLE ROW LEVEL SECURITY;

-- 12.1 hotels -- owner / service_role only. No `OR is_active = true`, which
--      would expose every active hotel's email, phone, address and user_id.
DROP POLICY IF EXISTS "hotel_select" ON public.hotels;
CREATE POLICY "hotel_select" ON public.hotels
  FOR SELECT USING (auth.role() = 'service_role' OR user_id = auth.uid());

DROP POLICY IF EXISTS "hotel_insert" ON public.hotels;
CREATE POLICY "hotel_insert" ON public.hotels
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

DROP POLICY IF EXISTS "hotel_update" ON public.hotels;
CREATE POLICY "hotel_update" ON public.hotels
  FOR UPDATE USING (auth.role() = 'service_role' OR user_id = auth.uid())
  WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

DROP POLICY IF EXISTS "hotel_delete" ON public.hotels;
CREATE POLICY "hotel_delete" ON public.hotels
  FOR DELETE USING (auth.role() = 'service_role' OR user_id = auth.uid());

-- 12.2 hotel_users
DROP POLICY IF EXISTS "hotel_users_select" ON public.hotel_users;
CREATE POLICY "hotel_users_select" ON public.hotel_users
  FOR SELECT USING (auth.role() = 'service_role' OR user_id = auth.uid());

DROP POLICY IF EXISTS "hotel_users_insert" ON public.hotel_users;
CREATE POLICY "hotel_users_insert" ON public.hotel_users
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "hotel_users_update" ON public.hotel_users;
CREATE POLICY "hotel_users_update" ON public.hotel_users
  FOR UPDATE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id))
  WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "hotel_users_delete" ON public.hotel_users;
CREATE POLICY "hotel_users_delete" ON public.hotel_users
  FOR DELETE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

-- 12.3 user_profiles -- self only
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'service_role' OR id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
CREATE POLICY "user_profiles_update" ON public.user_profiles
  FOR UPDATE USING (auth.role() = 'service_role' OR id = auth.uid())
  WITH CHECK (auth.role() = 'service_role' OR id = auth.uid());

-- 12.4 categories / menu_items -- guest-menu read, active hotels only
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (public.hotel_is_active(hotel_id));

DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage" ON public.categories
  FOR ALL USING (public.user_owns_hotel(hotel_id))
  WITH CHECK (public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "menu_items_select" ON public.menu_items;
CREATE POLICY "menu_items_select" ON public.menu_items
  FOR SELECT USING (public.hotel_is_active(hotel_id));

DROP POLICY IF EXISTS "menu_items_manage" ON public.menu_items;
CREATE POLICY "menu_items_manage" ON public.menu_items
  FOR ALL USING (public.user_owns_hotel(hotel_id))
  WITH CHECK (public.user_owns_hotel(hotel_id));

-- 12.5 orders
--      insert : a guest may order, but only against a REAL, ACTIVE hotel
--               (replaces `WITH CHECK (true)`, which accepted any hotel_id)
--      select : owner only. Replaces `OR true`, which made every order row in
--               the database readable with the public key.
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (public.hotel_is_active(hotel_id));

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id))
  WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "orders_delete" ON public.orders;
CREATE POLICY "orders_delete" ON public.orders
  FOR DELETE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

-- 12.6 order_items -- parent-order scoped (replaces `USING (true)`), and a
--      line may only attach to an existing order and a same-hotel dish.
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    public.order_hotel_id(order_id) IS NOT NULL
    AND (menu_item_id IS NULL OR public.menu_item_hotel_id(menu_item_id) = public.order_hotel_id(order_id))
  );

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (auth.role() = 'service_role' OR public.user_owns_hotel(public.order_hotel_id(order_id)));

DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
CREATE POLICY "order_items_update" ON public.order_items
  FOR UPDATE USING (auth.role() = 'service_role' OR public.user_owns_hotel(public.order_hotel_id(order_id)))
  WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(public.order_hotel_id(order_id)));

-- 12.7 order_status_history -- no orphan entries
DROP POLICY IF EXISTS "order_status_history_insert" ON public.order_status_history;
CREATE POLICY "order_status_history_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (public.order_hotel_id(order_id) IS NOT NULL);

DROP POLICY IF EXISTS "order_status_history_select" ON public.order_status_history;
CREATE POLICY "order_status_history_select" ON public.order_status_history
  FOR SELECT USING (auth.role() = 'service_role' OR public.user_owns_hotel(public.order_hotel_id(order_id)));

-- 12.8 reviews -- insert requires the owning hotel or service_role, replacing
--      `WITH CHECK (true)` (an unauthenticated arbitrary-row write endpoint).
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (
    hotel_id IS NOT NULL
    AND (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id))
  );

DROP POLICY IF EXISTS "reviews_update" ON public.reviews;
CREATE POLICY "reviews_update" ON public.reviews
  FOR UPDATE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id))
  WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

-- 12.9 qr_codes -- owner only
DROP POLICY IF EXISTS "qr_codes_select" ON public.qr_codes;
CREATE POLICY "qr_codes_select" ON public.qr_codes
  FOR SELECT USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

DROP POLICY IF EXISTS "qr_codes_manage" ON public.qr_codes;
CREATE POLICY "qr_codes_manage" ON public.qr_codes
  FOR ALL USING (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id))
  WITH CHECK (auth.role() = 'service_role' OR public.user_owns_hotel(hotel_id));

-- =====================================================================
-- 13. GRANTS  (least privilege, explicit per table)
-- =====================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

REVOKE ALL ON public.hotels, public.hotel_users, public.user_profiles,
  public.categories, public.menu_items, public.orders, public.order_items,
  public.order_status_history, public.reviews, public.qr_codes FROM anon;

-- Guest menu read only.
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.categories TO anon;

REVOKE ALL ON FUNCTION public.hotel_is_active(uuid)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_hotel(uuid)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.order_hotel_id(uuid)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.menu_item_hotel_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hotel_is_active(uuid)    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_hotel(uuid)    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.order_hotel_id(uuid)     TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.menu_item_hotel_id(uuid) TO anon, authenticated, service_role;

-- =====================================================================
-- 14. DROP TRANSIENT HELPERS  (the 4 policy helpers in section 2 stay)
-- =====================================================================

DROP FUNCTION IF EXISTS public._fix_ensure_fk(text,text,text,text,text,boolean);
DROP FUNCTION IF EXISTS public._fix_ensure_pk(text);
DROP FUNCTION IF EXISTS public._fix_index(text,text);
DROP FUNCTION IF EXISTS public._fix_tighten(text,text);

COMMIT;