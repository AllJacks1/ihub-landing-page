-- Duplicate-safe migration for Kitchen/Bar department statuses.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pos_orders' AND column_name='kitchen_status') THEN
    ALTER TABLE public.pos_orders ADD COLUMN kitchen_status text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pos_orders' AND column_name='bar_status') THEN
    ALTER TABLE public.pos_orders ADD COLUMN bar_status text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pos_orders_kitchen_status_check' AND conrelid='public.pos_orders'::regclass) THEN
    ALTER TABLE public.pos_orders ADD CONSTRAINT pos_orders_kitchen_status_check
      CHECK (kitchen_status IS NULL OR kitchen_status IN ('order_placed','preparing','serving','served'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pos_orders_bar_status_check' AND conrelid='public.pos_orders'::regclass) THEN
    ALTER TABLE public.pos_orders ADD CONSTRAINT pos_orders_bar_status_check
      CHECK (bar_status IS NULL OR bar_status IN ('order_placed','preparing','serving','served'));
  END IF;
END $$;

-- RPC (same as proposal)
CREATE OR REPLACE FUNCTION public.update_order_department_status(
  p_order_id uuid,
  p_department text,
  p_new_status text
) RETURNS TABLE(kitchen_status text, bar_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_has_kitchen boolean;
  v_has_bar boolean;
  v_unknown_area boolean;
  v_cur_k text; v_cur_b text; v_cur_overall text;
  v_allowed boolean := false;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE auth_user_id = auth.uid();
  IF v_role IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_department='kitchen' AND v_role NOT IN ('management','partner') THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_department='bar' AND v_role NOT IN ('management','crew') THEN RAISE EXCEPTION 'unauthorized'; END IF;

  IF p_department NOT IN ('kitchen','bar') THEN RAISE EXCEPTION 'invalid department'; END IF;
  IF p_new_status NOT IN ('order_placed','preparing','serving','served') THEN RAISE EXCEPTION 'invalid status'; END IF;

  SELECT o.kitchen_status, o.bar_status, o.status INTO v_cur_k, v_cur_b, v_cur_overall
  FROM public.pos_orders o WHERE o.id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_cur_overall IN ('completed','cancelled','refunded') THEN RAISE EXCEPTION 'order is %', v_cur_overall; END IF;

  SELECT
    EXISTS (SELECT 1 FROM public.pos_order_items i JOIN public.pos_areas a ON a.id=i.area_id WHERE i.order_id=p_order_id AND a.code='ieat'),
    EXISTS (SELECT 1 FROM public.pos_order_items i JOIN public.pos_areas a ON a.id=i.area_id WHERE i.order_id=p_order_id AND a.code='idrink'),
    EXISTS (SELECT 1 FROM public.pos_order_items i LEFT JOIN public.pos_areas a ON a.id=i.area_id WHERE i.order_id=p_order_id AND (i.area_id IS NULL OR a.id IS NULL OR a.code NOT IN ('ieat','idrink','istudy')))
  INTO v_has_kitchen, v_has_bar, v_unknown_area;

  IF v_unknown_area THEN RAISE EXCEPTION 'unrecognized area assignment'; END IF;
  IF p_department='kitchen' AND NOT v_has_kitchen THEN RAISE EXCEPTION 'no kitchen items'; END IF;
  IF p_department='bar' AND NOT v_has_bar THEN RAISE EXCEPTION 'no bar items'; END IF;

  IF p_department='kitchen' THEN
    IF v_cur_k IS NULL AND p_new_status='order_placed' THEN v_allowed := true;
    ELSIF v_cur_k='order_placed' AND p_new_status='preparing' THEN v_allowed := true;
    ELSIF v_cur_k='preparing' AND p_new_status='serving' THEN v_allowed := true;
    ELSIF v_cur_k='serving' AND p_new_status='served' THEN v_allowed := true;
    END IF;
    IF NOT v_allowed THEN RAISE EXCEPTION 'invalid transition'; END IF;
    UPDATE public.pos_orders SET kitchen_status=p_new_status, updated_at=now() WHERE id=p_order_id;
    v_cur_k := p_new_status;
  ELSE
    v_allowed := false;
    IF v_cur_b IS NULL AND p_new_status='order_placed' THEN v_allowed := true;
    ELSIF v_cur_b='order_placed' AND p_new_status='preparing' THEN v_allowed := true;
    ELSIF v_cur_b='preparing' AND p_new_status='serving' THEN v_allowed := true;
    ELSIF v_cur_b='serving' AND p_new_status='served' THEN v_allowed := true;
    END IF;
    IF NOT v_allowed THEN RAISE EXCEPTION 'invalid transition'; END IF;
    UPDATE public.pos_orders SET bar_status=p_new_status, updated_at=now() WHERE id=p_order_id;
    v_cur_b := p_new_status;
  END IF;

  RETURN QUERY SELECT v_cur_k, v_cur_b;
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_department_status(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_department_status(uuid,text,text) TO authenticated;
