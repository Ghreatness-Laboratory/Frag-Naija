-- Admin undo for Gaming Alerts match result finalization.
CREATE OR REPLACE FUNCTION public.admin_delete_match_result_alert(p_match_result_id UUID)
RETURNS TABLE (
  match_result_id UUID,
  tournament_match_id UUID,
  reverted_status TEXT,
  deleted_notifications INTEGER,
  preserved_subscriptions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.match_results%ROWTYPE;
  v_match public.tournament_matches%ROWTYPE;
  v_deleted_notifications INTEGER := 0;
  v_preserved_subscriptions INTEGER := 0;
  v_reverted_status TEXT := 'live';
BEGIN
  SELECT * INTO v_result
  FROM public.match_results
  WHERE id = p_match_result_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match result not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_result.source_type = 'tournament_match' AND v_result.source_id IS NOT NULL THEN
    SELECT * INTO v_match
    FROM public.tournament_matches
    WHERE id = v_result.source_id
    FOR UPDATE;

    IF FOUND THEN
      -- The pre-finalized state is not currently tracked. A just-finalized match was most
      -- likely live immediately beforehand, so default to live per product guidance.
      v_reverted_status := 'live';

      SELECT COUNT(*) INTO v_preserved_subscriptions
      FROM public.match_notification_subscriptions
      WHERE match_result_id = v_result.id;

      DELETE FROM public.match_notification_subscriptions result_sub
      WHERE result_sub.match_result_id = v_result.id
        AND EXISTS (
          SELECT 1
          FROM public.match_notification_subscriptions match_sub
          WHERE match_sub.user_id = result_sub.user_id
            AND match_sub.tournament_match_id = v_match.id
        );

      UPDATE public.match_notification_subscriptions
      SET tournament_match_id = v_match.id,
          match_result_id = NULL
      WHERE match_result_id = v_result.id;
    END IF;
  END IF;

  DELETE FROM public.notifications
  WHERE match_result_id = v_result.id;
  GET DIAGNOSTICS v_deleted_notifications = ROW_COUNT;

  DELETE FROM public.match_results
  WHERE id = v_result.id;

  IF v_match.id IS NOT NULL THEN
    UPDATE public.tournament_matches
    SET status = v_reverted_status,
        updated_at = NOW()
    WHERE id = v_match.id;
  END IF;

  match_result_id := v_result.id;
  tournament_match_id := v_match.id;
  reverted_status := v_reverted_status;
  deleted_notifications := v_deleted_notifications;
  preserved_subscriptions := v_preserved_subscriptions;
  RETURN NEXT;
END;
$$;
