-- Atomic customer quantity update
CREATE OR REPLACE FUNCTION public.update_order_item_quantity_atomic(
  p_order_id uuid,
  p_order_item_id uuid,
  p_quantity integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS 
DECLARE
  v_order orders%ROWTYPE;
  v_item order_items%ROWTYPE;
  v_item_status text;
  v_order_status text;
  v_active_total numeric(10,2) := 0;
  v_item_schema_status boolean;
  r record;
BEGIN
  IF p_quantity < 1 THEN
    RAISE EXCEPTION 'quantity must be >= 1';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  v_order_status := lower(trim(v_order.status));
  IF v_order_status NOT IN ('pending','accepted','placed') THEN
    RAISE EXCEPTION 'Quantity cannot be edited at this stage';
  END IF;

  SELECT * INTO v_item FROM order_items WHERE id = p_order_item_id AND order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  BEGIN
    SELECT true INTO v_item_schema_status FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='status';
  EXCEPTION WHEN OTHERS THEN
    v_item_schema_status := false;
  END;
  IF v_item_schema_status IS NULL THEN v_item_schema_status := false; END IF;

  IF v_item_schema_status THEN
    v_item_status := lower(trim(coalesce(v_item.status, 'active')));
    IF v_item_status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot edit cancelled item';
    END IF;
  END IF;

  UPDATE order_items SET quantity = p_quantity WHERE id = p_order_item_id AND order_id = p_order_id;

  FOR r IN SELECT quantity, price_at_time, status FROM order_items WHERE order_id = p_order_id
  LOOP
    IF v_item_schema_status THEN
      IF lower(trim(coalesce(r.status,'active'))) = 'cancelled' THEN
        CONTINUE;
      END IF;
    END IF;
    v_active_total := v_active_total + (coalesce(r.quantity,0) * coalesce(r.price_at_time,0));
  END LOOP;

  UPDATE orders SET total_amount = v_active_total, updated_at = now() WHERE id = p_order_id;
  RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'total_amount', v_active_total);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
;
