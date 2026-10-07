ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS signup_bonus_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_bonus_claimed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_bonus_claimed_at timestamptz;

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('Stake', 'Payout', 'Refund', 'Adjustment', 'Withdrawal', 'Signup Bonus'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_signup_bonus_once
  ON public.wallet_transactions(user_id)
  WHERE type = 'Signup Bonus';

CREATE OR REPLACE FUNCTION public.claim_signup_bonus(p_user_id uuid)
RETURNS TABLE (
  wallet_id uuid,
  balance numeric,
  credited_amount numeric,
  signup_bonus_claimed boolean,
  signup_bonus_claimed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet public.wallets%ROWTYPE;
BEGIN
  SELECT *
  INTO v_wallet
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_wallet.signup_bonus_eligible OR v_wallet.signup_bonus_claimed THEN
    RETURN QUERY
      SELECT
        v_wallet.id,
        v_wallet.balance,
        0::numeric,
        v_wallet.signup_bonus_claimed,
        v_wallet.signup_bonus_claimed_at;
    RETURN;
  END IF;

  UPDATE public.wallets AS w
  SET
    balance = w.balance + 500,
    signup_bonus_eligible = false,
    signup_bonus_claimed = true,
    signup_bonus_claimed_at = now(),
    updated_at = now()
  WHERE w.user_id = p_user_id
  RETURNING *
  INTO v_wallet;

  INSERT INTO public.wallet_transactions (
    user_id,
    type,
    amount,
    currency,
    description
  )
  VALUES (
    p_user_id,
    'Signup Bonus',
    500,
    'NGN',
    'Signup bonus claimed from Wager Zone'
  );

  RETURN QUERY
    SELECT
      v_wallet.id,
      v_wallet.balance,
      500::numeric,
      v_wallet.signup_bonus_claimed,
      v_wallet.signup_bonus_claimed_at;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_bonus(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_signup_bonus(uuid) TO service_role;
