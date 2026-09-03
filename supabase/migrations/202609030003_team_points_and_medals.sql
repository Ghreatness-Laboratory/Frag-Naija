-- Team ranking and placement tallies are manually maintained by administrators.
-- Keep this feature entirely in the public schema; the legacy Django tables are
-- intentionally not referenced.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS silver_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bronze_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.teams
  DROP COLUMN IF EXISTS wins,
  DROP COLUMN IF EXISTS losses;

CREATE INDEX IF NOT EXISTS idx_teams_points ON public.teams (points DESC);

NOTIFY pgrst, 'reload schema';
