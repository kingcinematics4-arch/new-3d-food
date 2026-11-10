-- supabase/migrations/031_water_billing_on_delivery.sql
--
-- Adds water-charges-on-delivery billing logic:
--   1. `water_charges_added` flag on public.orders (idempotency guard)
--   2. `deliver_water_order` RPC function: atomically marks a water order
--      delivered and adds its water total to the parent food order's bill.
-- Idempotent; safe to re-run.

begin;

-- 1. Idempotency flag: tracks whether water charges have already been billed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'water_charges_added'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN water_charges_added boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for fast lookup of water orders whose charges haven't been billed yet
CREATE INDEX IF NOT EXISTS idx_orders_water_charges_added ON public.orders(water_charges_added);

-- 2. RPC function: atomic water order delivery + billing
--    Call this instead of a plain UPDATE when delivering a water order.
CREATE OR REPLACE FUNCTION public.deliver_water_order(water_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  water_order RECORD;
  parent_order RECORD;
  water_total numeric(10,2) := 0;
  already_added boolean := false;
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

  -- Idempotency: if charges already added, return early
  SELECT water_charges_added INTO already_added FROM public.orders WHERE id = water_order_id;

  IF already_added THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_delivered', true,
      'message', 'Water charges already billed'
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

  -- Atomic update: mark water order as delivered, record its total, set idempotency flag
  UPDATE public.orders
  SET status = 'delivered',
      total_amount = water_total,
      water_charges_added = true,
      updated_at = now()
  WHERE id = water_order_id;

  -- Add history record
  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (water_order_id, 'delivered', 'Water order delivered to table; charges added to parent bill');

  RETURN jsonb_build_object(
    'success', true,
    'water_total', water_total,
    'parent_order_id', water_order.linked_order_id,
    'parent_order_total', parent_order.total_amount,
    'message', 'Water order delivered; charges added to parent bill'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the RPC function to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.deliver_water_order(uuid) TO anon, authenticated, service_role;

commit;

-- Refresh PostgREST schema cache so the new RPC function is immediately available
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
