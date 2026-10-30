-- PROPOSAL ONLY — DO NOT APPLY.
-- Corrected atomic order completion with per-order-item inventory idempotency.

-- 1. Add per-line idempotency support to movements (if not already present).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pos_inventory_movements' AND column_name='order_item_id'
  ) THEN
    ALTER TABLE public.pos_inventory_movements ADD COLUMN order_item_id uuid;
  END IF;
END $$;

-- Ensure one movement per order item per movement type.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='idx_pos_inventory_movements_order_item_type'
  ) THEN
    CREATE UNIQUE INDEX idx_pos_inventory_movements_order_item_type
      ON public.pos_inventory_movements(order_item_id, movement_type)
      WHERE order_item_id IS NOT NULL;
  END IF;
END $$;

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
    SELECT id AS order_item_id, product_id, quantity
    FROM public.pos_order_items
    WHERE order_id = p_order_id
  LOOP
    -- Idempotent per order item: skip if movement already recorded.
    IF EXISTS (
      SELECT 1 FROM public.pos_inventory_movements
      WHERE order_item_id = v_item.order_item_id
        AND movement_type = 'stock_out'
    ) THEN
      CONTINUE;
    END IF;

    IF v_order.branch_id IS NOT NULL THEN
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
    END IF;

    INSERT INTO public.pos_inventory_movements (
      branch_id, product_id, movement_type, quantity, reference_id, order_item_id, notes
    ) VALUES (
      v_order.branch_id, v_item.product_id, 'stock_out', -v_item.quantity, p_order_id, v_item.order_item_id, 'Order sale'
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

REVOKE ALL ON FUNCTION public.rpc_complete_order_atomic(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_complete_order_atomic(uuid) TO authenticated;
