-- supabase/migrations/001_initial.sql
-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- public.hotels
--
-- This file is fully re-runnable. It is deliberately written to reconcile
-- whatever shape `public.hotels` already has: an earlier deployment created
-- that table with `restaurant_name` / `location` and without the tenant,
-- branding or billing columns this app writes. Re-running this migration
-- renames/creates the missing columns instead of failing on CREATE TABLE.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'hotels'
  ) THEN
    CREATE TABLE public.hotels (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      owner_name text,
      email text,
      phone text,
      city text,
      address text,
      location text,
      logo_url text,
      primary_color text DEFAULT '#f59e0b',
      secondary_color text DEFAULT '#10b981',
      menu_style text DEFAULT 'cards',
      card_style text DEFAULT 'glass-morphic',
      dark_mode boolean DEFAULT true,
      typography text DEFAULT 'Inter',
      welcome_text text DEFAULT 'Experience our menu in 3D!',
      custom_domain text,
      currency text DEFAULT 'USD ($)',
      tax_rate numeric(5,2) DEFAULT 8.875,
      service_charge numeric(5,2) DEFAULT 5.0,
      is_active boolean DEFAULT true,
      subscription_plan text DEFAULT 'starter',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Legacy deployments stored the display name in `restaurant_name`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'restaurant_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'name'
  ) THEN
    EXECUTE 'ALTER TABLE public.hotels RENAME COLUMN restaurant_name TO name';
  END IF;
END $$;

-- Every column the app reads or writes.
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS menu_style text DEFAULT 'cards',
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'glassmorphic',
  ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS typography text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS welcome_text text DEFAULT 'Experience our menu in 3D!',
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD ($)',
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 8.875,
  ADD COLUMN IF NOT EXISTS service_charge numeric(5,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- One hotel per owner, so a user can never resolve two restaurants.
CREATE UNIQUE INDEX IF NOT EXISTS hotels_user_id_unique
  ON public.hotels (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS hotels_slug_unique
  ON public.hotels (slug)
  WHERE slug IS NOT NULL;

-- Backfill, then tighten the NOT NULL constraints only when no row is broken.
UPDATE public.hotels
   SET name = COALESCE(NULLIF(name, ''), NULLIF(restaurant_name::text, ''), 'Restaurant')
 WHERE name IS NULL OR name = '';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'restaurant_name') THEN
    EXECUTE 'UPDATE public.hotels SET name = restaurant_name WHERE name IS NULL OR name = ''''';
  END IF;

  UPDATE public.hotels
     SET slug = lower(regexp_replace(COALESCE(NULLIF(name, ''), slug), '[^a-zA-Z0-9]+', '-', 'g'))
             || '-' || substr(md5(COALESCE(name, '') || id::text), 1, 6)
   WHERE slug IS NULL OR slug = '';

  IF NOT EXISTS (SELECT 1 FROM public.hotels WHERE name IS NULL) THEN
    EXECUTE 'ALTER TABLE public.hotels ALTER COLUMN name SET NOT NULL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hotels WHERE slug IS NULL) THEN
    EXECUTE 'ALTER TABLE public.hotels ALTER COLUMN slug SET NOT NULL';
  END IF;
END $$;

-- Never allow a password/credential column on hotels.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'password'
  ) THEN
    ALTER TABLE public.hotels DROP COLUMN password;
  END IF;
END $$;

-- hotel_users – link user to hotel
CREATE TABLE IF NOT EXISTS public.hotel_users (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  role text DEFAULT 'owner',
  PRIMARY KEY (user_id, hotel_id)
);

-- users profile (optional extra info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- categories (hotel‑specific)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- menu_items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  image_url text,
  model_url_glb text,
  model_url_usdz text,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_popular boolean DEFAULT false,
  is_veg boolean DEFAULT true,
  allergens text[] DEFAULT '{}',
  rating numeric(3,2) DEFAULT 0,
  order_count integer DEFAULT 0,
  dietary_tags text[] DEFAULT '{}',
  calories integer,
  preparation_time_mins integer,
  ingredients text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- orders (guest orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  table_number text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text NOT NULL DEFAULT 'pay_at_table',
  subtotal numeric(10,2) DEFAULT 0,
  tax numeric(10,2) DEFAULT 0,
  service_charge numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price_at_time numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE CASCADE,
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  menu_item_name text,
  table_number text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  customer_name text DEFAULT 'Guest Diner',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- qr_codes
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  target_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row‑Level Security for all hotel‑scoped tables
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Owner backfill: link existing auth users to their hotel
--
-- Signup inserts the hotel and the hotel_users row together, so a user without
-- a hotel is an account whose onboarding failed. When such an account has no
-- hotel at all, the owner link is repaired here from the account's own signup
-- metadata (no invented names, no demo rows).
-- ----------------------------------------------------
INSERT INTO public.hotel_users (user_id, hotel_id, role)
SELECT h.user_id, h.id, 'owner'
  FROM public.hotels h
 WHERE h.user_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.hotel_users hu
      WHERE hu.user_id = h.user_id AND hu.hotel_id = h.id
   );

INSERT INTO public.hotels (user_id, name, slug, owner_name, email, is_active, subscription_plan)
SELECT u.id,
       COALESCE(NULLIF(u.raw_user_meta_data ->> 'hotel_name', ''), u.email),
       lower(regexp_replace(COALESCE(NULLIF(u.raw_user_meta_data ->> 'hotel_name', ''), u.email), '[^a-zA-Z0-9]+', '-', 'g'))
         || '-' || substr(md5(u.id::text), 1, 6),
       u.raw_user_meta_data ->> 'owner_name',
       u.email,
       true,
       'starter'
  FROM auth.users u
 WHERE NOT EXISTS (SELECT 1 FROM public.hotels h WHERE h.user_id = u.id);

INSERT INTO public.hotel_users (user_id, hotel_id, role)
SELECT h.user_id, h.id, 'owner'
  FROM public.hotels h
 WHERE h.user_id IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM public.hotel_users hu
      WHERE hu.user_id = h.user_id AND hu.hotel_id = h.id
   );
