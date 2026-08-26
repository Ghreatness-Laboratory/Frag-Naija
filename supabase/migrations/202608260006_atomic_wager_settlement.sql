-- Atomic, idempotent wager settlement so admin-settled markets update user bets,
-- wallet balances, wallet history, and settlement notifications consistently.
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS settlement_outcome text;

ALTER TABLE public.wager_bets
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_credited_at timestamptz,
  ADD COLUMN IF NOT EXISTS settlement_outcome text;

CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_wager_payout_once_idx
  ON public.wallet_transactions (bet_id)
  WHERE type = 'Payout' AND bet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wager_bets_wager_status_idx
  ON public.wager_bets (wager_id, status);

CREATE OR REPLACE FUNCTION public.settle_wager_market(
  p_wager_id uuid,
  p_outcome text,
  p_max_payout numeric DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wager public.wagers%ROWTYPE;
  v_bet public.wager_bets%ROWTYPE;
  v_uses_named boolean;
  v_status text;
  v_odds numeric;
  v_payout numeric;
  v_winners integer := 0;
  v_losers integer := 0;
  v_credited integer := 0;
  v_existing_payout uuid;
BEGIN
  IF p_wager_id IS NULL OR trim(coalesce(p_outcome, '')) = '' THEN
    RAISE EXCEPTION 'wager_id and outcome are required';
  END IF;

  SELECT * INTO v_wager
  FROM public.wagers
  WHERE id = p_wager_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wager not found';
  END IF;

  v_uses_named := v_wager.type IN ('player_pick', 'team_pick');
  v_status := CASE
    WHEN v_uses_named THEN 'Settled — ' || p_outcome || ' Wins'
    WHEN p_outcome = 'YES' THEN 'Settled — YES Wins'
    WHEN p_outcome = 'NO' THEN 'Settled — NO Wins'
    ELSE NULL
  END;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Binary wagers can only be settled with YES or NO';
  END IF;

  UPDATE public.wagers
  SET status = v_status,
      settlement_outcome = p_outcome,
      settled_at = coalesce(settled_at, now())
  WHERE id = p_wager_id;

  FOR v_bet IN
    SELECT *
    FROM public.wager_bets
    WHERE wager_id = p_wager_id
      AND status <> 'Refunded'
    FOR UPDATE
  LOOP
    IF v_bet.selection = p_outcome THEN
      v_winners := v_winners + 1;

      IF v_uses_named THEN
        SELECT NULLIF(option_item->>'odds', '')::numeric INTO v_odds
        FROM jsonb_array_elements(coalesce(v_wager.options, '[]'::jsonb)) AS option_item
        WHERE option_item->>'label' = p_outcome
        LIMIT 1;
        v_odds := coalesce(v_odds, 1);
      ELSE
        v_odds := CASE WHEN p_outcome = 'YES' THEN v_wager.yes_odds ELSE v_wager.no_odds END;
      END IF;

      v_payout := v_bet.amount * coalesce(v_odds, 1);
      IF p_max_payout IS NOT NULL THEN
        v_payout := LEAST(v_payout, p_max_payout);
      END IF;

      SELECT id INTO v_existing_payout
      FROM public.wallet_transactions
      WHERE bet_id = v_bet.id
        AND type = 'Payout'
      LIMIT 1;

      IF v_bet.user_id IS NOT NULL AND v_existing_payout IS NULL THEN
        INSERT INTO public.wallets (user_id, balance, total_won, total_lost)
        VALUES (v_bet.user_id, 0, 0, 0)
        ON CONFLICT (user_id) DO NOTHING;

        UPDATE public.wallets
        SET balance = balance + v_payout,
            total_won = coalesce(total_won, 0) + v_payout,
            updated_at = now()
        WHERE user_id = v_bet.user_id;

        INSERT INTO public.wallet_transactions (user_id, wager_id, bet_id, type, amount, currency, description)
        VALUES (v_bet.user_id, p_wager_id, v_bet.id, 'Payout', v_payout, 'NGN', 'Wager payout — ' || p_outcome || ' wins')
        ON CONFLICT DO NOTHING;

        v_credited := v_credited + 1;
      END IF;

      UPDATE public.wager_bets
      SET status = 'Won',
          settlement_outcome = p_outcome,
          settled_at = coalesce(settled_at, now()),
          payout_credited_at = CASE WHEN v_bet.user_id IS NULL THEN payout_credited_at ELSE coalesce(payout_credited_at, now()) END
      WHERE id = v_bet.id;
    ELSE
      v_losers := v_losers + 1;
      UPDATE public.wager_bets
      SET status = 'Lost',
          settlement_outcome = p_outcome,
          settled_at = coalesce(settled_at, now())
      WHERE id = v_bet.id;

      IF v_bet.user_id IS NOT NULL AND v_bet.status <> 'Lost' THEN
        UPDATE public.wallets
        SET total_lost = coalesce(total_lost, 0) + greatest(v_bet.amount, 0),
            updated_at = now()
        WHERE user_id = v_bet.user_id;
      END IF;
    END IF;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM public.notifications
    WHERE type = 'wager_settlement'
      AND metadata->>'wager_id' = p_wager_id::text
      AND metadata->>'outcome' = p_outcome
  ) THEN
    INSERT INTO public.notifications (type, title, message, url, metadata)
    VALUES (
      'wager_settlement',
      'Wager settled',
      coalesce(v_wager.question, 'A wager') || ' settled: ' || p_outcome || ' wins.',
      '/wager',
      jsonb_build_object('wager_id', p_wager_id, 'outcome', p_outcome, 'winners', v_winners, 'losers', v_losers, 'credited', v_credited)
    );
  END IF;

  RETURN jsonb_build_object('settled', true, 'winners', v_winners, 'losers', v_losers, 'credited', v_credited, 'status', v_status);
END;
$$;

REVOKE ALL ON FUNCTION public.settle_wager_market(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_wager_market(uuid, text, numeric) TO service_role;
