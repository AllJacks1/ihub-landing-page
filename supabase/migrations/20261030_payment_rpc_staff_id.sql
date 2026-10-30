-- New migration: service-role-safe payment RPC with explicit staff identity.

DROP FUNCTION IF EXISTS public.rpc_record_payment_and_start_session_timer(
  uuid, text, numeric, numeric, numeric, text, text
);

CREATE OR REPLACE FUNCTION public.rpc_record_payment_and_start_session_timer(
  p_order_id uuid,
  p_payment_method text,
  p_amount numeric,
  p_received_amount numeric,
  p_change_amount numeric,
  p_reference_number text,
  p_idempotency_key text,
  p_staff_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_payment record;
  v_existing_payment record;
  v_now timestamptz := now();
BEGIN
  IF p_order_id IS NULL THEN RAISE EXCEPTION 'order_id is required'; END IF;
  IF p_payment_method IS NULL THEN RAISE EXCEPTION 'payment_method is required'; END IF;
  IF p_amount IS NULL THEN RAISE EXCEPTION 'amount is required'; END IF;
  IF p_received_amount IS NULL THEN RAISE EXCEPTION 'received_amount is required'; END IF;
  IF p_change_amount IS NULL THEN RAISE EXCEPTION 'change_amount is required'; END IF;
  IF p_staff_user_id IS NULL THEN RAISE EXCEPTION 'staff_user_id is required'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = p_staff_user_id AND role = 'management'
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_payment_method NOT IN ('cash','card','gcash','maya','bank_transfer','other') THEN
    RAISE EXCEPTION 'invalid payment method';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;
  IF p_received_amount < 0 THEN
    RAISE EXCEPTION 'invalid received amount';
  END IF;
  IF p_change_amount <> GREATEST(0, p_received_amount - p_amount) THEN
    RAISE EXCEPTION 'invalid change amount';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_payment FROM public.pos_payments WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      IF v_existing_payment.order_id <> p_order_id THEN
        RAISE EXCEPTION 'idempotency key belongs to a different order';
      END IF;
      RETURN jsonb_build_object('success', true, 'duplicate', true, 'payment', row_to_json(v_existing_payment));
    END IF;
  END IF;

  SELECT * INTO v_order FROM public.pos_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order not found'; END IF;
  IF v_order.status = 'cancelled' THEN RAISE EXCEPTION 'cannot take payment on a cancelled order'; END IF;
  IF v_order.status = 'completed' THEN RAISE EXCEPTION 'order already completed'; END IF;

  INSERT INTO public.pos_payments (
    order_id, payment_method, amount, received_amount, change_amount,
    reference_number, status, idempotency_key, paid_at
  ) VALUES (
    p_order_id, p_payment_method, p_amount, p_received_amount, p_change_amount,
    p_reference_number, 'completed', p_idempotency_key, now()
  ) RETURNING * INTO v_payment;

  RETURN jsonb_build_object('success', true, 'duplicate', false, 'payment', row_to_json(v_payment));
EXCEPTION
  WHEN unique_violation THEN
    IF p_idempotency_key IS NOT NULL THEN
      SELECT * INTO v_existing_payment FROM public.pos_payments WHERE idempotency_key = p_idempotency_key;
      IF FOUND THEN
        IF v_existing_payment.order_id <> p_order_id THEN
          RAISE;
        END IF;
        RETURN jsonb_build_object('success', true, 'duplicate', true, 'payment', row_to_json(v_existing_payment));
      END IF;
    END IF;
    RAISE;
  WHEN OTHERS THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_record_payment_and_start_session_timer(uuid,text,numeric,numeric,numeric,text,text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_record_payment_and_start_session_timer(uuid,text,numeric,numeric,numeric,text,text,uuid) FROM anon;
REVOKE ALL ON FUNCTION public.rpc_record_payment_and_start_session_timer(uuid,text,numeric,numeric,numeric,text,text,uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_record_payment_and_start_session_timer(uuid,text,numeric,numeric,numeric,text,text,uuid) TO service_role;
