-- Manual withdrawal queue: atomically reserve wallet funds and refund rejected requests.
-- This migration only accesses public application tables.

CREATE OR REPLACE FUNCTION public.create_manual_withdrawal(
  p_user_id uuid, p_amount numeric, p_fee numeric, p_amount_sent numeric,
  p_bank_name text, p_bank_code text, p_account_number text, p_account_name text,
  p_paystack_recipient_code text DEFAULT NULL
) RETURNS public.withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance numeric; v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_amount <= 0 OR p_amount_sent < 0 OR p_fee < 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount';
  END IF;
  IF COALESCE(trim(p_bank_name), '') = '' OR COALESCE(trim(p_account_number), '') = '' OR COALESCE(trim(p_account_name), '') = '' THEN
    RAISE EXCEPTION 'Bank name, account number, and account name are required';
  END IF;

  -- Lock first so concurrent requests cannot both reserve the same balance.
  SELECT balance INTO v_balance FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  IF EXISTS (SELECT 1 FROM public.withdrawals WHERE user_id = p_user_id AND status = 'Pending') THEN
    RAISE EXCEPTION 'You already have a pending withdrawal request';
  END IF;

  UPDATE public.wallets SET balance = balance - p_amount, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.withdrawals (user_id, amount, fee, amount_sent, bank_name, bank_code, account_number, account_name, paystack_recipient_code, status)
  VALUES (p_user_id, p_amount, p_fee, p_amount_sent, p_bank_name, p_bank_code, p_account_number, p_account_name, p_paystack_recipient_code, 'Pending')
  RETURNING * INTO v_withdrawal;
  INSERT INTO public.wallet_transactions (user_id, type, amount, currency, description)
  VALUES (p_user_id, 'Withdrawal', -p_amount, 'NGN', 'Manual withdrawal request — ' || p_bank_name || ' ****' || right(p_account_number, 4));
  RETURN v_withdrawal;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_manual_withdrawal(p_withdrawal_id uuid, p_admin_note text DEFAULT NULL)
RETURNS public.withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status <> 'Pending' THEN RAISE EXCEPTION 'Only pending withdrawals can be rejected'; END IF;
  UPDATE public.wallets SET balance = balance + v_withdrawal.amount, updated_at = now() WHERE user_id = v_withdrawal.user_id;
  UPDATE public.withdrawals SET status = 'Failed', admin_note = p_admin_note, updated_at = now() WHERE id = p_withdrawal_id RETURNING * INTO v_withdrawal;
  INSERT INTO public.wallet_transactions (user_id, type, amount, currency, description)
  VALUES (v_withdrawal.user_id, 'Refund', v_withdrawal.amount, 'NGN', 'Manual withdrawal rejected — full refund');
  RETURN v_withdrawal;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_manual_withdrawal(p_withdrawal_id uuid, p_admin_note text DEFAULT NULL)
RETURNS public.withdrawals
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_withdrawal public.withdrawals%ROWTYPE;
BEGIN
  SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status <> 'Pending' THEN RAISE EXCEPTION 'Only pending withdrawals can be completed'; END IF;
  UPDATE public.withdrawals SET status = 'Completed', admin_note = p_admin_note, updated_at = now() WHERE id = p_withdrawal_id RETURNING * INTO v_withdrawal;
  RETURN v_withdrawal;
END;
$$;

REVOKE ALL ON FUNCTION public.create_manual_withdrawal(uuid,numeric,numeric,numeric,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_manual_withdrawal(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_manual_withdrawal(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_manual_withdrawal(uuid,numeric,numeric,numeric,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_manual_withdrawal(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_manual_withdrawal(uuid,text) TO service_role;
