-- supabase/policies.sql
-- Row-Level Security (RLS) policies for Multi-Tenant Hotel Isolation and Public Ordering
--
-- Identity model: the signed-in owner is `auth.uid()` (the Supabase Auth user id).
-- `public.hotels.user_id` is the canonical owner -> hotel link (with
-- `public.hotel_users` accepted as an equivalent owner link). Credentials
-- (passwords) live only in Supabase Auth, never in public.hotels.
--
-- Every policy is dropped before it is created, so this file is re-runnable.

-- ----------------------------------------------------
-- 1. HOTELS
-- ----------------------------------------------------
-- A user may create their own hotel row during onboarding
DROP POLICY IF EXISTS "hotel_insert" ON public.hotels;
CREATE POLICY "hotel_insert" ON public.hotels
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Owners read their own hotel; public diners read active hotels (slug lookup)
DROP POLICY IF EXISTS "hotel_select" ON public.hotels;
CREATE POLICY "hotel_select" ON public.hotels
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR is_active = true
  );

-- Owners may update their own hotel
DROP POLICY IF EXISTS "hotel_update" ON public.hotels;
CREATE POLICY "hotel_update" ON public.hotels
  FOR UPDATE USING (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = hotels.id AND hu.user_id = auth.uid())
  ) WITH CHECK (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = hotels.id AND hu.user_id = auth.uid())
  );

-- ----------------------------------------------------
-- 2. HOTEL_USERS (membership / staff link table)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "hotel_users_select" ON public.hotel_users;
CREATE POLICY "hotel_users_select" ON public.hotel_users
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "hotel_users_insert" ON public.hotel_users;
CREATE POLICY "hotel_users_insert" ON public.hotel_users
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "hotel_users_update" ON public.hotel_users;
CREATE POLICY "hotel_users_update" ON public.hotel_users
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------
-- 3. CATEGORIES & MENU_ITEMS (Public Guest Viewable & Hotel Admin Manageable)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage" ON public.categories
  FOR ALL USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = categories.hotel_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = categories.hotel_id AND hu.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "menu_items_select" ON public.menu_items;
CREATE POLICY "menu_items_select" ON public.menu_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "menu_items_manage" ON public.menu_items;
CREATE POLICY "menu_items_manage" ON public.menu_items
  FOR ALL USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = menu_items.hotel_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = menu_items.hotel_id AND hu.user_id = auth.uid())
  );

-- ----------------------------------------------------
-- 4. ORDERS & ORDER_ITEMS (Public Diners Insert & Hotel Staff Manage)
-- ----------------------------------------------------
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = orders.hotel_id AND h.user_id = auth.uid())
    OR auth.role() = 'service_role'
    OR true -- customer live order tracking
  );

DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = orders.hotel_id AND h.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (true);

-- ----------------------------------------------------
-- 5. REVIEWS & QR_CODES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Only the owning hotel can list its reviews
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (
    hotel_id IS NOT NULL AND (
      auth.role() = 'service_role'
      OR EXISTS (SELECT 1 FROM public.hotels h
                  WHERE h.id = reviews.hotel_id AND h.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "qr_codes_select" ON public.qr_codes;
CREATE POLICY "qr_codes_select" ON public.qr_codes
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = qr_codes.hotel_id AND h.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "qr_codes_manage" ON public.qr_codes;
CREATE POLICY "qr_codes_manage" ON public.qr_codes
  FOR ALL USING (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM public.hotels h
                WHERE h.id = qr_codes.hotel_id AND h.user_id = auth.uid())
  );
