-- Admin-only permanent cleanup for settled/cancelled wager markets.
-- Financial audit rows in wallet_transactions are preserved by existing SET NULL FKs.
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  FOR v_constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.wallet_transactions'::regclass
      AND contype = 'f'
      AND confrelid = 'public.wagers'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.wallet_transactions DROP CONSTRAINT %I', v_constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_wager_id_fkey
  FOREIGN KEY (wager_id) REFERENCES public.wagers(id) ON DELETE SET NULL;

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  FOR v_constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.wallet_transactions'::regclass
      AND contype = 'f'
      AND confrelid = 'public.wager_bets'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.wallet_transactions DROP CONSTRAINT %I', v_constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_bet_id_fkey
  FOREIGN KEY (bet_id) REFERENCES public.wager_bets(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.admin_delete_settled_wager(
  p_wager_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wager public.wagers%ROWTYPE;
  v_deleted_bets integer := 0;
BEGIN
  IF p_wager_id IS NULL THEN
    RAISE EXCEPTION 'wager_id is required';
  END IF;

  SELECT * INTO v_wager
  FROM public.wagers
  WHERE id = p_wager_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wager not found';
  END IF;

  IF NOT (v_wager.status LIKE 'Settled%' OR v_wager.status = 'Cancelled') THEN
    RAISE EXCEPTION 'Only settled or cancelled wagers can be permanently deleted';
  END IF;

  DELETE FROM public.wager_bets
  WHERE wager_id = p_wager_id;
  GET DIAGNOSTICS v_deleted_bets = ROW_COUNT;

  DELETE FROM public.wagers
  WHERE id = p_wager_id;

  RETURN jsonb_build_object(
    'deleted', true,
    'wager_id', p_wager_id,
    'deleted_bets', v_deleted_bets,
    'preserved_wallet_transactions', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_settled_wager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_settled_wager(uuid) TO service_role;
