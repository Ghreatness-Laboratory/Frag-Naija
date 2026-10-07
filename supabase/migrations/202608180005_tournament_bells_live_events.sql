-- Tournament-level Gaming Alerts subscriptions and append-only live event history.
ALTER TABLE public.tournament_matches
  ADD COLUMN IF NOT EXISTS live_events JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.tournament_notification_subscriptions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tournament_id)
);

CREATE INDEX IF NOT EXISTS tournament_notification_subscriptions_tournament_idx
  ON public.tournament_notification_subscriptions(tournament_id);

ALTER TABLE public.tournament_notification_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournament_notification_subscriptions_user_read" ON public.tournament_notification_subscriptions FOR SELECT USING (auth.uid() = user_id);
