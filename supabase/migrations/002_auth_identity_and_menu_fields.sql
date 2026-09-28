-- supabase/migrations/002_auth_identity_and_menu_fields.sql
--
-- Replaces the demo/mock identity model with a real Supabase Auth identity model:
--
--   * public.hotels.user_id is the canonical link between an authenticated
--     Supabase user (auth.users.id / auth.uid()) and the hotel they own.
--     Passwords are NEVER stored here - credentials stay in Supabase Auth.
--   * Menu items gain the real columns the dashboard already renders.
--   * Menu theme settings move from localStorage (demo) to the hotels row.
--   * Reviews become hotel-scoped so the dashboard can list them per hotel.

-- ----------------------------------------------------
-- 1. hotels.user_id – canonical auth identity
-- ----------------------------------------------------
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill from the existing hotel_users link table (owner rows only).
UPDATE public.hotels h
   SET user_id = hu.user_id
  FROM public.hotel_users hu
 WHERE hu.hotel_id = h.id
   AND h.user_id IS NULL
   AND hu.role = 'owner';

CREATE UNIQUE INDEX IF NOT EXISTS hotels_user_id_unique
  ON public.hotels (user_id)
  WHERE user_id IS NOT NULL;

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

-- ----------------------------------------------------
-- 2. Menu theme settings (were demo-only localStorage state)
-- ----------------------------------------------------
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#10b981',
  ADD COLUMN IF NOT EXISTS menu_style text DEFAULT 'cards',
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'glassmorphic',
  ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS typography text DEFAULT 'Inter';

-- ----------------------------------------------------
-- 3. menu_items – real columns for the existing dashboard UI
-- ----------------------------------------------------
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_popular boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_veg boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_count integer DEFAULT 0;

-- ----------------------------------------------------
-- 4. reviews – scope to a hotel
-- ----------------------------------------------------
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS menu_item_name text,
  ADD COLUMN IF NOT EXISTS table_number text;

-- Backfill hotel_id / table_number from the order chain.
UPDATE public.reviews r
   SET hotel_id = o.hotel_id,
       table_number = o.table_number
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
 WHERE oi.id = r.order_item_id
   AND r.hotel_id IS NULL;

-- ----------------------------------------------------
-- 5. RLS – owner identity now resolves through hotels.user_id
-- ----------------------------------------------------
DROP POLICY IF EXISTS "hotel_insert" ON public.hotels;
CREATE POLICY "hotel_insert" ON public.hotels
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "hotel_update" ON public.hotels;
CREATE POLICY "hotel_update" ON public.hotels
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = hotels.id AND hu.user_id = auth.uid())
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = hotels.id AND hu.user_id = auth.uid())
  );

-- A user may read exactly their own hotel row.
DROP POLICY IF EXISTS "hotel_select" ON public.hotels;
CREATE POLICY "hotel_select" ON public.hotels
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR is_active = true -- public customer menu lookup by slug
  );

-- Owners may only see their own reviews.
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (
    hotel_id IS NOT NULL AND (
      auth.role() = 'service_role'
      OR EXISTS (SELECT 1 FROM public.hotels h
                  WHERE h.id = reviews.hotel_id AND h.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true); -- public diners submit reviews from the QR menu
