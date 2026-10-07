-- The admin wager form submits a market type and its selectable options.  Keep
-- these fields on the public wagers table so service-role admin writes and the
-- public Wager Zone read the same current schema.
ALTER TABLE public.wagers
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE public.wagers DROP CONSTRAINT IF EXISTS wagers_type_check;
ALTER TABLE public.wagers
  ADD CONSTRAINT wagers_type_check CHECK (type IN ('binary', 'player_pick', 'team_pick'));
