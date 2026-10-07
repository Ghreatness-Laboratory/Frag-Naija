-- Atomic public-schema wallet balance helpers for deposits, wager stakes, payouts, refunds, and admin adjustments.
-- These functions only touch public tables whose user_id columns reference Supabase auth.users.

ALTER TABLE public.wager_bets
  DROP CONSTRAINT IF EXISTS wager_bets_selection_check;

CREATE OR REPLACE FUNCTION public.process_wallet_deposit(
  p_user_id uuid,
  p_reference text,
  p_amount_paid numeric,
  p_fee numeric,
  p_amount_credited numeric
) RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF p_amount_paid < 100 OR p_amount_credited < 0 THEN
    RAISE EXCEPTION 'Minimum deposit is ₦100';
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE reference = p_reference;
  IF FOUND THEN
    RETURN v_tx;
  END IF;

  INSERT INTO public.transactions (user_id, reference, type, amount_paid, fee, amount_credited, status)
  VALUES (p_user_id, p_reference, 'deposit', p_amount_paid, p_fee, p_amount_credited, 'completed')
  RETURNING * INTO v_tx;

  INSERT INTO public.wallets (user_id, balance, total_won, total_lost)
  VALUES (p_user_id, p_amount_credited, 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.wallets.balance + EXCLUDED.balance,
    updated_at = now();

  RETURN v_tx;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_wager_from_wallet(
  p_user_id uuid,
  p_wager_id uuid,
  p_email text,
  p_selection text,
  p_amount numeric,
  p_potential numeric,
  p_reference text
) RETURNS public.wager_bets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bet public.wager_bets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF p_amount < 0 OR p_potential < 0 THEN
    RAISE EXCEPTION 'Invalid wager amount';
  END IF;
  IF p_amount > 0 AND p_amount < 100 THEN
    RAISE EXCEPTION 'Minimum stake is ₦100';
  END IF;

  SELECT * INTO v_bet FROM public.wager_bets WHERE reference = p_reference;
  IF FOUND THEN
    RETURN v_bet;
  END IF;

  IF p_amount > 0 THEN
    UPDATE public.wallets
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
      AND balance >= p_amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
  END IF;

  INSERT INTO public.wager_bets (wager_id, user_id, email, selection, amount, potential, reference, status)
  VALUES (p_wager_id, p_user_id, p_email, p_selection, p_amount, p_potential, p_reference, 'Active')
  RETURNING * INTO v_bet;

  PERFORM public.increment_wager_pool(p_wager_id, p_amount);

  IF p_amount <> 0 THEN
    INSERT INTO public.wallet_transactions (user_id, wager_id, bet_id, type, amount, currency, description)
    VALUES (p_user_id, p_wager_id, v_bet.id, 'Stake', -p_amount, 'NGN', 'Wager stake — ' || p_selection || ' on wager ' || p_wager_id);
  END IF;

  RETURN v_bet;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wager_payout(
  p_user_id uuid,
  p_wager_id uuid,
  p_bet_id uuid,
  p_payout numeric,
  p_description text
) RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_payout < 0 THEN
    RAISE EXCEPTION 'Invalid payout';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_payout,
      total_won = COALESCE(total_won, 0) + p_payout,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, wager_id, bet_id, type, amount, currency, description)
  VALUES (p_user_id, p_wager_id, p_bet_id, 'Payout', p_payout, 'NGN', p_description);

  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_wager_loss(
  p_user_id uuid,
  p_amount numeric
) RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  UPDATE public.wallets
  SET total_lost = COALESCE(total_lost, 0) + GREATEST(p_amount, 0),
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;
  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_wager_stake(
  p_user_id uuid,
  p_wager_id uuid,
  p_bet_id uuid,
  p_amount numeric,
  p_description text
) RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid refund';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, wager_id, bet_id, type, amount, currency, description)
  VALUES (p_user_id, p_wager_id, p_bet_id, 'Refund', p_amount, 'NGN', p_description);

  RETURN v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_wallet_adjustment(
  p_user_id uuid,
  p_reference text,
  p_type text,
  p_amount numeric,
  p_note text DEFAULT NULL
) RETURNS TABLE (transaction_id uuid, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta numeric;
  v_balance numeric;
  v_tx_id uuid;
BEGIN
  IF p_type NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'Adjustment type must be credit or debit';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Adjustment amount must be positive';
  END IF;

  v_delta := CASE WHEN p_type = 'credit' THEN p_amount ELSE -p_amount END;

  UPDATE public.wallets
  SET balance = balance + v_delta,
      updated_at = now()
  WHERE user_id = p_user_id
    AND balance + v_delta >= 0
  RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found or debit would result in a negative balance';
  END IF;

  INSERT INTO public.transactions (user_id, reference, type, amount_paid, fee, amount_credited, status, note)
  VALUES (p_user_id, p_reference, p_type, p_amount, 0, v_delta, 'completed', p_note)
  RETURNING id INTO v_tx_id;

  transaction_id := v_tx_id;
  new_balance := v_balance;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.process_wallet_deposit(uuid,text,numeric,numeric,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_wager_from_wallet(uuid,uuid,text,text,numeric,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_wager_payout(uuid,uuid,uuid,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_wager_loss(uuid,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_wager_stake(uuid,uuid,uuid,numeric,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_wallet_adjustment(uuid,text,text,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_wallet_deposit(uuid,text,numeric,numeric,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_wager_from_wallet(uuid,uuid,text,text,numeric,numeric,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wager_payout(uuid,uuid,uuid,numeric,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_wager_loss(uuid,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_wager_stake(uuid,uuid,uuid,numeric,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_wallet_adjustment(uuid,text,text,numeric,text) TO service_role;

CREATE OR REPLACE FUNCTION public.place_duel_wager_from_wallet(
  p_duel_id uuid,
  p_user_id uuid,
  p_picked_player_id uuid,
  p_stake numeric,
  p_odds numeric,
  p_potential_payout numeric
) RETURNS public.duel_wagers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wager public.duel_wagers%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_stake <= 0 THEN
    RAISE EXCEPTION 'Invalid duel stake';
  END IF;
  IF p_stake < 100 THEN
    RAISE EXCEPTION 'Minimum stake is ₦100';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_stake,
      updated_at = now()
  WHERE user_id = p_user_id
    AND balance >= p_stake;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  INSERT INTO public.duel_wagers (duel_id, user_id, picked_player_id, stake, odds_at_placement, potential_payout)
  VALUES (p_duel_id, p_user_id, p_picked_player_id, p_stake, p_odds, p_potential_payout)
  RETURNING * INTO v_wager;

  INSERT INTO public.wallet_transactions (user_id, type, amount, currency, description)
  VALUES (p_user_id, 'Stake', -p_stake, 'NGN', 'TDM 1V1 stake — duel ' || p_duel_id);

  RETURN v_wager;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_duel_payout(
  p_user_id uuid,
  p_amount numeric,
  p_description text
) RETURNS public.wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Invalid duel payout';
  END IF;

  UPDATE public.wallets
  SET balance = balance + p_amount,
      total_won = COALESCE(total_won, 0) + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_wallet;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, currency, description)
  VALUES (p_user_id, 'Payout', p_amount, 'NGN', p_description);

  RETURN v_wallet;
END;
$$;

REVOKE ALL ON FUNCTION public.place_duel_wager_from_wallet(uuid,uuid,uuid,numeric,numeric,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_duel_payout(uuid,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_duel_wager_from_wallet(uuid,uuid,uuid,numeric,numeric,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_duel_payout(uuid,numeric,text) TO service_role;
