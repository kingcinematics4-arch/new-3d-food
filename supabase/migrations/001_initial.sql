-- supabase/migrations/001_initial.sql
-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- hotels table – each restaurant
-- NOTE: passwords are never stored here. Supabase Auth (auth.users) owns
-- credentials; hotels.user_id is the canonical link to the signed-in owner.
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
  logo_url text,
  primary_color text DEFAULT '#f59e0b',
  secondary_color text DEFAULT '#10b981',
  menu_style text DEFAULT 'cards',
  card_style text DEFAULT 'glassmorphic',
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

-- hotel_users – link user to hotel
CREATE TABLE public.hotel_users (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  role text DEFAULT 'owner',
  PRIMARY KEY (user_id, hotel_id)
);

-- users profile (optional extra info)
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- categories (hotel‑specific)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- menu_items
CREATE TABLE public.menu_items (
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
CREATE TABLE public.orders (
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
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id),
  quantity integer NOT NULL DEFAULT 1,
  price_at_time numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_status_history
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- reviews
CREATE TABLE public.reviews (
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
CREATE TABLE public.qr_codes (
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
