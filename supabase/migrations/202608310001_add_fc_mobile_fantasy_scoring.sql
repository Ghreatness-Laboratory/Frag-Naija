-- FC Mobile uses its own football scoring model.  All tables remain in public
-- and continue to reference Supabase auth user IDs through fantasy_squads.
ALTER TABLE public.fantasy_scoring_config
  ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  ADD COLUMN IF NOT EXISTS appearance_points NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS goal_points NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS win_points NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS loss_points NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS conceded_points NUMERIC(6,2);

UPDATE public.fantasy_scoring_config SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
CREATE UNIQUE INDEX IF NOT EXISTS fantasy_scoring_config_game_slug_unique ON public.fantasy_scoring_config(game_slug);

INSERT INTO public.fantasy_scoring_config (
  name, game_slug, appearance_points, goal_points, win_points, loss_points,
  conceded_points, captain_multiplier, triple_captain_multiplier
) VALUES ('FC Mobile default', 'fc-mobile', 1, 5, 3, -2, -1, 2, 3)
ON CONFLICT (game_slug) DO NOTHING;

ALTER TABLE public.fantasy_gameweeks ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'pubg-mobile';
ALTER TABLE public.fantasy_squads ADD COLUMN IF NOT EXISTS game_slug TEXT NOT NULL DEFAULT 'pubg-mobile';
ALTER TABLE public.fantasy_match_stats
  ADD COLUMN IF NOT EXISTS goals INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  ADD COLUMN IF NOT EXISTS goals_conceded INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS fantasy_squads_game_slug_idx ON public.fantasy_squads(game_slug, total_points DESC);

CREATE OR REPLACE FUNCTION public.calculate_fantasy_match_points(
  p_game_slug TEXT,
  p_participated BOOLEAN,
  p_kills INT,
  p_top_three_finish BOOLEAN,
  p_match_win BOOLEAN,
  p_mvp BOOLEAN,
  p_goals INT DEFAULT 0,
  p_result TEXT DEFAULT NULL,
  p_goals_conceded INT DEFAULT 0
) RETURNS NUMERIC AS $$
DECLARE cfg public.fantasy_scoring_config%ROWTYPE; total NUMERIC := 0;
BEGIN
  SELECT * INTO cfg FROM public.fantasy_scoring_config WHERE game_slug = p_game_slug ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  IF p_game_slug = 'fc-mobile' THEN
    RETURN (CASE WHEN p_participated THEN COALESCE(cfg.appearance_points, 1) ELSE 0 END)
      + COALESCE(p_goals, 0) * COALESCE(cfg.goal_points, 5)
      + CASE WHEN p_result = 'win' THEN COALESCE(cfg.win_points, 3) WHEN p_result = 'loss' THEN COALESCE(cfg.loss_points, -2) ELSE 0 END
      + COALESCE(p_goals_conceded, 0) * COALESCE(cfg.conceded_points, -1);
  END IF;
  total := (CASE WHEN p_participated THEN COALESCE(cfg.participation_points, 1) ELSE 0 END) + COALESCE(p_kills, 0) * COALESCE(cfg.kill_points, 2) + (CASE WHEN p_mvp THEN COALESCE(cfg.mvp_bonus, 5) ELSE 0 END);
  RETURN total + CASE WHEN p_match_win THEN COALESCE(cfg.match_win_points, 10) WHEN p_top_three_finish THEN COALESCE(cfg.top_three_finish_points, 5) ELSE 0 END;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.refresh_fantasy_gameweek_points(p_gameweek_id UUID) RETURNS VOID AS $$
DECLARE v_game_slug TEXT;
BEGIN
  SELECT game_slug INTO v_game_slug FROM public.fantasy_gameweeks WHERE id = p_gameweek_id;
  UPDATE public.fantasy_squads s SET gameweek_points = COALESCE((
    SELECT SUM(CASE WHEN ms.athlete_id = s.captain_id AND s.active_chip = 'triple_captain' THEN ms.fantasy_points * 3 WHEN ms.athlete_id = s.captain_id THEN ms.fantasy_points * 2 ELSE ms.fantasy_points END)
    FROM public.fantasy_match_stats ms WHERE ms.gameweek_id = s.gameweek_id AND ms.athlete_id = ANY(s.starter_ids)
  ), 0), updated_at = NOW() WHERE s.gameweek_id = p_gameweek_id AND s.game_slug = v_game_slug;
  UPDATE public.fantasy_squads s SET total_points = COALESCE((SELECT SUM(s2.gameweek_points) FROM public.fantasy_squads s2 WHERE s2.user_id = s.user_id AND s2.game_slug = s.game_slug), 0) WHERE s.game_slug = v_game_slug;
END;
$$ LANGUAGE plpgsql;
