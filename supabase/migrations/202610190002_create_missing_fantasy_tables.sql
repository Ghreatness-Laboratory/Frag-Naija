-- ==============================================================================
-- Migration: Create Missing Fantasy Tables & Reload Schema
-- Purpose: Provisions all fantasy tables expected by the codebase:
--   - public.fantasy_settings
--   - public.fantasy_squads
--   - public.fantasy_matches
--   - public.fantasy_match_stats
--   - public.fantasy_gameweeks
--   - public.fantasy_scoring_config
--   - public.athletes_fantasy_price_backup
-- ==============================================================================

-- 1. Ensure pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create fantasy_settings table
-- Value column is JSONB to store objects, numbers, booleans, and timestamps
CREATE TABLE IF NOT EXISTS public.fantasy_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Create fantasy_gameweeks table (referenced by matches and squads)
CREATE TABLE IF NOT EXISTS public.fantasy_gameweeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  starts_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'selection' CHECK (status IN ('selection', 'locked', 'scoring', 'complete')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Create fantasy_matches table
CREATE TABLE IF NOT EXISTS public.fantasy_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek_id UUID REFERENCES public.fantasy_gameweeks(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  title TEXT NOT NULL,
  team_a TEXT,
  team_b TEXT,
  starts_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'stats_entered', 'finalized')),
  stats_last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Create fantasy_match_stats table
CREATE TABLE IF NOT EXISTS public.fantasy_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.fantasy_matches(id) ON DELETE CASCADE,
  gameweek_id UUID REFERENCES public.fantasy_gameweeks(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  participated BOOLEAN DEFAULT true,
  kills INT DEFAULT 0,
  top_three_finish BOOLEAN DEFAULT false,
  match_win BOOLEAN DEFAULT false,
  mvp BOOLEAN DEFAULT false,
  goals INT DEFAULT 0,
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  goals_conceded INT DEFAULT 0,
  finalized BOOLEAN DEFAULT false,
  fantasy_points NUMERIC(8,2) DEFAULT 0,
  stats_last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fantasy_match_stats_match_athlete_unique UNIQUE (match_id, athlete_id)
);

-- 6. Create fantasy_squads table
CREATE TABLE IF NOT EXISTS public.fantasy_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  gameweek_id UUID REFERENCES public.fantasy_gameweeks(id) ON DELETE SET NULL,
  starter_ids UUID[] DEFAULT '{}',
  bench_ids UUID[] DEFAULT '{}',
  captain_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  squad_value NUMERIC(14,2) DEFAULT 0,
  remaining_budget NUMERIC(14,2) DEFAULT 10000000,
  active_chip TEXT,
  chip_usage JSONB DEFAULT '{}'::jsonb,
  total_points NUMERIC(10,2) DEFAULT 0,
  gameweek_points NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fantasy_squads_user_game_unique UNIQUE (user_id, game_slug)
);

-- 7. Create fantasy_scoring_config table
CREATE TABLE IF NOT EXISTS public.fantasy_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  appearance_points NUMERIC(6,2),
  goal_points NUMERIC(6,2),
  win_points NUMERIC(6,2),
  loss_points NUMERIC(6,2),
  conceded_points NUMERIC(6,2),
  participation_points NUMERIC(6,2) DEFAULT 1,
  kill_points NUMERIC(6,2) DEFAULT 2,
  top_three_finish_points NUMERIC(6,2) DEFAULT 5,
  match_win_points NUMERIC(6,2) DEFAULT 10,
  mvp_bonus NUMERIC(6,2) DEFAULT 5,
  captain_multiplier NUMERIC(4,2) DEFAULT 2,
  triple_captain_multiplier NUMERIC(4,2) DEFAULT 3,
  finish_points_stack BOOLEAN DEFAULT false,
  chip_usage_limits JSONB DEFAULT '{"manual_substitute":{"per_gameweek":1},"triple_captain":{"per_season":1}}'::jsonb,
  substitution_rules JSONB DEFAULT '{"auto_sub_when_no_participation":true,"bench_priority":"user_order"}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fantasy_scoring_config_game_slug_unique UNIQUE (game_slug)
);

-- 8. Create athletes_fantasy_price_backup table to preserve old prices
CREATE TABLE IF NOT EXISTS public.athletes_fantasy_price_backup (
  id UUID NOT NULL,
  game_slug TEXT,
  name TEXT,
  overall_rating NUMERIC(5,2),
  fantasy_price NUMERIC(14,2),
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id, backed_up_at)
);

-- 9. Seed default fantasy settings
INSERT INTO public.fantasy_settings (key, value, updated_at)
VALUES
  ('fc_mobile_budget', '6000000'::jsonb, timezone('utc'::text, now())),
  ('pubg_mobile_budget', '10000000'::jsonb, timezone('utc'::text, now())),
  ('free_fire_budget', '10000000'::jsonb, timezone('utc'::text, now())),
  ('fc_mobile_allow_repick', 'true'::jsonb, timezone('utc'::text, now())),
  ('fc_mobile_transfer_window', '{"gameSlug":"fc-mobile","status":"open","transfersRemaining":6,"opens":"","closes":""}'::jsonb, timezone('utc'::text, now())),
  ('pubg_mobile_transfer_window', '{"gameSlug":"pubg-mobile","status":"closed","transfersRemaining":0,"opens":"","closes":""}'::jsonb, timezone('utc'::text, now())),
  ('pubg_mobile_chip_windows', '{"triple_captain":{"status":"closed","opens":"","closes":""},"manual_substitute":{"status":"closed","opens":"","closes":""}}'::jsonb, timezone('utc'::text, now()))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

-- 10. Seed default scoring configs
INSERT INTO public.fantasy_scoring_config (
  name, game_slug, appearance_points, goal_points, win_points, loss_points, conceded_points, captain_multiplier, triple_captain_multiplier
) VALUES (
  'FC Mobile default', 'fc-mobile', 1, 5, 3, -2, -1, 2, 3
) ON CONFLICT (game_slug) DO NOTHING;

INSERT INTO public.fantasy_scoring_config (
  name, game_slug, participation_points, kill_points, top_three_finish_points, match_win_points, mvp_bonus, captain_multiplier, triple_captain_multiplier
) VALUES (
  'PUBG Mobile default', 'pubg-mobile', 1, 2, 5, 10, 5, 2, 3
) ON CONFLICT (game_slug) DO NOTHING;

-- 11. Create performance indexes
CREATE INDEX IF NOT EXISTS fantasy_matches_gameweek_idx ON public.fantasy_matches(gameweek_id, status);
CREATE INDEX IF NOT EXISTS fantasy_match_stats_match_idx ON public.fantasy_match_stats(match_id);
CREATE INDEX IF NOT EXISTS fantasy_squads_game_slug_idx ON public.fantasy_squads(game_slug, total_points DESC);

-- 12. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
