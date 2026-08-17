-- Fantasy League manual match-stat entry and automated point rollups.
CREATE TABLE IF NOT EXISTS public.fantasy_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gameweek_id UUID NOT NULL REFERENCES public.fantasy_gameweeks(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  title TEXT NOT NULL,
  team_a TEXT,
  team_b TEXT,
  starts_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','stats_entered','finalized')),
  stats_last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fantasy_match_stats
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.fantasy_matches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS stats_last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized BOOLEAN DEFAULT false;

ALTER TABLE public.fantasy_match_stats ALTER COLUMN kills DROP DEFAULT;
DROP INDEX IF EXISTS fantasy_match_stats_gameweek_athlete_unique;
CREATE UNIQUE INDEX IF NOT EXISTS fantasy_match_stats_match_athlete_unique ON public.fantasy_match_stats(match_id, athlete_id) WHERE match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fantasy_matches_gameweek_idx ON public.fantasy_matches(gameweek_id, status);
CREATE INDEX IF NOT EXISTS fantasy_match_stats_match_idx ON public.fantasy_match_stats(match_id);

CREATE OR REPLACE FUNCTION public.calculate_fantasy_match_points(
  p_participated BOOLEAN,
  p_kills INT,
  p_top_three_finish BOOLEAN,
  p_match_win BOOLEAN,
  p_mvp BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
  cfg public.fantasy_scoring_config%ROWTYPE;
  total NUMERIC := 0;
BEGIN
  SELECT * INTO cfg FROM public.fantasy_scoring_config ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  IF cfg.id IS NULL THEN
    total := (CASE WHEN p_participated THEN 1 ELSE 0 END) + (COALESCE(p_kills, 0) * 2) +
      (CASE WHEN p_top_three_finish THEN 5 ELSE 0 END) + (CASE WHEN p_match_win THEN 10 ELSE 0 END) +
      (CASE WHEN p_mvp THEN 5 ELSE 0 END);
  ELSE
    total := (CASE WHEN p_participated THEN COALESCE(cfg.participation_points, 0) ELSE 0 END) +
      (COALESCE(p_kills, 0) * COALESCE(cfg.kill_points, 0)) +
      (CASE WHEN p_mvp THEN COALESCE(cfg.mvp_bonus, 0) ELSE 0 END);
    IF COALESCE(cfg.finish_points_stack, false) THEN
      total := total + (CASE WHEN p_top_three_finish THEN COALESCE(cfg.top_three_finish_points, 0) ELSE 0 END) +
        (CASE WHEN p_match_win THEN COALESCE(cfg.match_win_points, 0) ELSE 0 END);
    ELSE
      total := total + CASE WHEN p_match_win THEN COALESCE(cfg.match_win_points, 0)
        WHEN p_top_three_finish THEN COALESCE(cfg.top_three_finish_points, 0) ELSE 0 END;
    END IF;
  END IF;
  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.refresh_fantasy_gameweek_points(p_gameweek_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.athletes a SET
    recent_fantasy_points = COALESCE((SELECT SUM(ms.fantasy_points) FROM public.fantasy_match_stats ms WHERE ms.gameweek_id = p_gameweek_id AND ms.athlete_id = a.id), 0),
    total_fantasy_points = COALESCE((SELECT SUM(ms.fantasy_points) FROM public.fantasy_match_stats ms WHERE ms.athlete_id = a.id), 0)
  WHERE EXISTS (SELECT 1 FROM public.fantasy_match_stats ms WHERE ms.athlete_id = a.id);

  UPDATE public.fantasy_squads s SET
    gameweek_points = COALESCE((
      SELECT SUM(CASE
        WHEN ms.athlete_id = s.captain_id AND s.active_chip = 'triple_captain' THEN ms.fantasy_points * 3
        WHEN ms.athlete_id = s.captain_id THEN ms.fantasy_points * 2
        ELSE ms.fantasy_points END)
      FROM public.fantasy_match_stats ms
      WHERE ms.gameweek_id = s.gameweek_id AND ms.athlete_id = ANY(s.starter_ids)
    ), 0),
    updated_at = NOW()
  WHERE s.gameweek_id = p_gameweek_id;

  UPDATE public.fantasy_squads s SET total_points = COALESCE((SELECT SUM(s2.gameweek_points) FROM public.fantasy_squads s2 WHERE s2.user_id = s.user_id), 0);
END;
$$ LANGUAGE plpgsql;
