-- Link Gaming Alerts match results to real Tournament records and tournament-owned fixtures.
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  title TEXT NOT NULL,
  team_a TEXT,
  team_b TEXT,
  starts_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tournament_matches_tournament_idx ON public.tournament_matches(tournament_id, starts_at);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournament_matches_public_read" ON public.tournament_matches FOR SELECT USING (true);

ALTER TABLE public.match_results
  ADD COLUMN IF NOT EXISTS placement_3_name TEXT,
  ADD COLUMN IF NOT EXISTS placement_4_name TEXT;

ALTER TABLE public.match_results
  DROP CONSTRAINT IF EXISTS match_results_source_type_check;

UPDATE public.match_results
SET source_type = 'tournament_match'
WHERE source_type IN ('tdm_1v1','wow_mode','general');

ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_source_type_check CHECK (source_type IN ('fantasy_match','tournament_match'));

ALTER TABLE public.match_results
  DROP CONSTRAINT IF EXISTS match_results_requires_tournament;
ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_requires_tournament CHECK (tournament_id IS NOT NULL) NOT VALID;
