-- PROPOSAL ONLY: not applied. Atomic completion to prevent duplicate inventory deductions.
-- Requires review before execution.

CREATE OR REPLACE FUNCTION public.rpc_complete_order_atomic(
  p_order_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_order record;
  v_item record;
  v_stock record;
BEGIN
  SELECT id INTO v_staff_id FROM public.profiles WHERE auth_user_id = auth.uid();
  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_order FROM public.pos_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;
  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object('success', true, 'alreadyCompleted', true);
  END IF;
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'cannot complete a cancelled order';
  END IF;

  FOR v_item IN
    SELECT product_id, quantity FROM public.pos_order_items WHERE order_id = p_order_id
  LOOP
    -- Skip if a sale movement already exists (idempotent).
    IF EXISTS (
      SELECT 1 FROM public.pos_inventory_movements
      WHERE reference_id = p_order_id
        AND product_id = v_item.product_id
        AND movement_type = 'sale'
    ) THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_stock FROM public.pos_inventory
    WHERE branch_id = v_order.branch_id AND product_id = v_item.product_id
    FOR UPDATE;

    IF FOUND THEN
      IF v_stock.stock_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'insufficient stock for product %', v_item.product_id;
      END IF;
      UPDATE public.pos_inventory
      SET stock_quantity = stock_quantity - v_item.quantity,
          updated_at = now()
      WHERE id = v_stock.id;
    END IF;

    INSERT INTO public.pos_inventory_movements (
      branch_id, product_id, movement_type, quantity, reference_id, notes
    ) VALUES (
      v_order.branch_id, v_item.product_id, 'sale', -v_item.quantity, p_order_id, 'Order sale'
    );
  END LOOP;

  UPDATE public.pos_orders
  SET status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'alreadyCompleted', false);
END;
$$;
