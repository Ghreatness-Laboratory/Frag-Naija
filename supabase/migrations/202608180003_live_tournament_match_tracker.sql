-- Sofascore-style Gaming Alerts live match tracker support.
ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS live_state JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.match_notification_subscriptions
  DROP CONSTRAINT IF EXISTS match_notification_subscriptions_pkey;

ALTER TABLE public.match_notification_subscriptions
  ALTER COLUMN match_result_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS tournament_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE;

UPDATE public.match_notification_subscriptions SET id = uuid_generate_v4() WHERE id IS NULL;
ALTER TABLE public.match_notification_subscriptions ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.match_notification_subscriptions ADD PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS match_notification_subscriptions_user_result_uidx
  ON public.match_notification_subscriptions(user_id, match_result_id)
  WHERE match_result_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS match_notification_subscriptions_user_tournament_match_uidx
  ON public.match_notification_subscriptions(user_id, tournament_match_id)
  WHERE tournament_match_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS match_notification_subscriptions_tournament_match_idx
  ON public.match_notification_subscriptions(tournament_match_id);
