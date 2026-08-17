-- Update Fantasy League scoring from the original PUBG stat tiers to the simplified configurable model.
ALTER TABLE public.fantasy_scoring_config
  ADD COLUMN IF NOT EXISTS participation_points NUMERIC(6,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS top_three_finish_points NUMERIC(6,2) DEFAULT 5,
  ADD COLUMN IF NOT EXISTS match_win_points NUMERIC(6,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS captain_multiplier NUMERIC(4,2) DEFAULT 2,
  ADD COLUMN IF NOT EXISTS triple_captain_multiplier NUMERIC(4,2) DEFAULT 3,
  ADD COLUMN IF NOT EXISTS finish_points_stack BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS chip_usage_limits JSONB DEFAULT '{"manual_substitute":{"per_gameweek":1},"triple_captain":{"per_season":1}}'::jsonb;

UPDATE public.fantasy_scoring_config
SET participation_points = COALESCE(participation_points, 1),
    kill_points = COALESCE(kill_points, 2),
    top_three_finish_points = COALESCE(top_three_finish_points, 5),
    match_win_points = COALESCE(match_win_points, 10),
    mvp_bonus = COALESCE(mvp_bonus, 5),
    captain_multiplier = COALESCE(captain_multiplier, 2),
    triple_captain_multiplier = COALESCE(triple_captain_multiplier, 3),
    finish_points_stack = COALESCE(finish_points_stack, false),
    chip_usage_limits = COALESCE(chip_usage_limits, '{"manual_substitute":{"per_gameweek":1},"triple_captain":{"per_season":1}}'::jsonb),
    updated_at = NOW();

ALTER TABLE public.fantasy_match_stats
  ADD COLUMN IF NOT EXISTS match_win BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS top_three_finish BOOLEAN DEFAULT false;

UPDATE public.fantasy_match_stats
SET match_win = COALESCE(match_win, placement = 1),
    top_three_finish = COALESCE(top_three_finish, placement BETWEEN 1 AND 3);

ALTER TABLE public.fantasy_squads
  ADD COLUMN IF NOT EXISTS active_chip TEXT CHECK (active_chip IN ('triple_captain')),
  ADD COLUMN IF NOT EXISTS chip_usage JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.fantasy_scoring_config.finish_points_stack IS 'False means match win and top-3 finish are mutually exclusive: win uses match_win_points, 2nd/3rd use top_three_finish_points.';
COMMENT ON COLUMN public.fantasy_scoring_config.chip_usage_limits IS 'Admin-editable chip limits, e.g. manual substitute per gameweek and Triple Captain per season.';
