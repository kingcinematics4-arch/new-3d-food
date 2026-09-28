-- supabase/policies.sql
-- Row-Level Security (RLS) policies for Multi-Tenant Hotel Isolation and Public Ordering
--
-- Identity model: the signed-in owner is `auth.uid()` (the Supabase Auth user id).
-- `public.hotels.user_id` is the canonical owner -> hotel link. Credentials
-- (passwords) live only in Supabase Auth, never in public.hotels.

-- ----------------------------------------------------
-- 1. HOTELS
-- ----------------------------------------------------
-- A user may create their own hotel row during onboarding
CREATE POLICY "hotel_insert" ON public.hotels
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- Owners read their own hotel; public diners read active hotels (slug lookup)
CREATE POLICY "hotel_select" ON public.hotels
  FOR SELECT USING (
    user_id = auth.uid()
    OR auth.role() = 'service_role'
    OR is_active = true
  );

-- Owners may update their own hotel
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

-- ----------------------------------------------------
-- 2. HOTEL_USERS (membership / staff link table)
-- ----------------------------------------------------
CREATE POLICY "hotel_users_select" ON public.hotel_users
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "hotel_users_insert" ON public.hotel_users
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "hotel_users_update" ON public.hotel_users
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------
-- 3. CATEGORIES & MENU_ITEMS (Public Guest Viewable & Hotel Admin Manageable)
-- ----------------------------------------------------
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories_manage" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = categories.hotel_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = categories.hotel_id AND hu.user_id = auth.uid())
  );

CREATE POLICY "menu_items_select" ON public.menu_items
  FOR SELECT USING (true);

CREATE POLICY "menu_items_manage" ON public.menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = menu_items.hotel_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hotel_users hu
                WHERE hu.hotel_id = menu_items.hotel_id AND hu.user_id = auth.uid())
  );

-- ----------------------------------------------------
-- 4. ORDERS & ORDER_ITEMS (Public Diners Insert & Hotel Staff Manage)
-- ----------------------------------------------------
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = orders.hotel_id AND h.user_id = auth.uid())
    OR auth.role() = 'service_role'
    OR true -- customer live order tracking
  );

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = orders.hotel_id AND h.user_id = auth.uid())
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (true);

-- ----------------------------------------------------
-- 5. REVIEWS & QR_CODES
-- ----------------------------------------------------
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Only the owning hotel can list its reviews
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (
    hotel_id IS NOT NULL AND (
      auth.role() = 'service_role'
      OR EXISTS (SELECT 1 FROM public.hotels h
                  WHERE h.id = reviews.hotel_id AND h.user_id = auth.uid())
    )
  );

CREATE POLICY "qr_codes_select" ON public.qr_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = qr_codes.hotel_id AND h.user_id = auth.uid())
  );

CREATE POLICY "qr_codes_manage" ON public.qr_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hotels h
             WHERE h.id = qr_codes.hotel_id AND h.user_id = auth.uid())
  );
