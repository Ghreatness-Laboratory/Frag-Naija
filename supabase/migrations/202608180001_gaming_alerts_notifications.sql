-- FragNaija Gaming Alerts notification pipeline.
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL DEFAULT 'general' CHECK (source_type IN ('fantasy_match','tdm_1v1','wow_mode','general')),
  source_id UUID,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  match_title TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  winner_ref_type TEXT CHECK (winner_ref_type IN ('team','athlete','custom')) DEFAULT 'custom',
  winner_ref_id UUID,
  mvp_name TEXT NOT NULL,
  mvp_athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_type, source_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'match_result',
  match_result_id UUID REFERENCES public.match_results(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  game_slug TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '/gaming-alerts',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  match_results_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);
CREATE INDEX IF NOT EXISTS match_results_finalized_at_idx ON public.match_results(finalized_at DESC);
CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx ON public.fcm_tokens(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_public_read" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "match_results_public_read" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "notification_reads_user_read" ON public.notification_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_user_read" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
