-- supabase/migrations/031_water_delivery_billing.sql
--
-- Adds independent water-delivery tracking and billing:
--   1. `water_delivered` boolean on public.orders — independent of food-order status
--   2. `water_charges_added` boolean on public.orders — idempotency guard for billing
--   3. `deliver_water_order(uuid)` RPC function: atomically sets water_delivered=true
--      and adds water charges to the parent food order's bill exactly once.
-- Idempotent; safe to re-run. Does NOT modify food-order status or transitions.

begin;

-- 1. Water delivery flag — separate from food-order status field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'water_delivered'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN water_delivered boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Idempotency flag for water billing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'water_charges_added'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN water_charges_added boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_water_delivered ON public.orders(water_delivered);
CREATE INDEX IF NOT EXISTS idx_orders_water_charges_added ON public.orders(water_charges_added);

-- 3. RPC function: atomic water delivery + billing
--    Sets water_delivered=true (NOT status). Does not touch food-order transitions.
CREATE OR REPLACE FUNCTION public.deliver_water_order(water_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  water_order RECORD;
  parent_order RECORD;
  water_total numeric(10,2) := 0;
  already_delivered boolean := false;
BEGIN
  -- Fetch the water order
  SELECT * INTO water_order FROM public.orders WHERE id = water_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Water order not found');
  END IF;

  -- Verify it's a water order (has linked_order_id pointing to parent food order)
  IF water_order.linked_order_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a water order');
  END IF;

  -- Idempotency: if already delivered, return early — no duplicate charges
  SELECT water_delivered INTO already_delivered FROM public.orders WHERE id = water_order_id;

  IF already_delivered THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_delivered', true,
      'message', 'Water order already delivered; charges already billed'
    );
  END IF;

  -- Calculate water total from order_items (actual prices x quantities)
  SELECT COALESCE(SUM(price_at_time * quantity), 0) INTO water_total
  FROM public.order_items
  WHERE order_id = water_order_id;

  -- Fetch parent food order
  SELECT * INTO parent_order FROM public.orders WHERE id = water_order.linked_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Parent order not found');
  END IF;

  -- Atomic update: mark water_delivered=true, set idempotency flag
  -- Do NOT change status — water orders keep their food-order status unchanged
  -- For dine-in water orders (linked_order_id set), keep total_amount at 0
  -- to avoid double counting in combined bill — charges are added to parent.
  -- For standalone water orders, set total_amount = water_total.
  UPDATE public.orders
  SET water_delivered = true,
      water_charges_added = true,
      total_amount = CASE
        WHEN linked_order_id IS NULL THEN water_total
        ELSE total_amount
      END,
      updated_at = now()
  WHERE id = water_order_id;

  -- Add water charges to parent food order's bill (idempotent via water_charges_added flag)
  UPDATE public.orders
  SET total_amount = total_amount + water_total,
      updated_at = now()
  WHERE id = water_order.linked_order_id;

  -- Add history record
  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (water_order_id, 'delivered', 'Water order delivered; charges added to parent bill');

  RETURN jsonb_build_object(
    'success', true,
    'water_total', water_total,
    'parent_order_id', water_order.linked_order_id,
    'parent_order_total', parent_order.total_amount + water_total,
    'message', 'Water order delivered; charges added to parent bill'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.deliver_water_order(uuid) TO anon, authenticated, service_role;

commit;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
