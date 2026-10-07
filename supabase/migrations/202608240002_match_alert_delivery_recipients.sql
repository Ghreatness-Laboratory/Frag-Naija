-- Match-alert deliveries are private to bell subscribers.  The tables below use
-- Supabase auth identities only; no legacy Django tables are involved.
CREATE TABLE IF NOT EXISTS public.notification_recipients (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS notification_recipients_user_delivered_idx
  ON public.notification_recipients(user_id, delivered_at DESC);

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_recipients_user_read"
  ON public.notification_recipients FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS tournament_match_id UUID REFERENCES public.tournament_matches(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_type_tournament_match_uidx
  ON public.notifications(type, tournament_match_id)
  WHERE tournament_match_id IS NOT NULL;
