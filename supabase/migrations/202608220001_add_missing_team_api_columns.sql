-- The public teams API selects these fields for ranking and administration.
-- Add them idempotently so deployments with the original teams schema do not
-- fail with "column does not exist" errors.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS rank INTEGER,
  ADD COLUMN IF NOT EXISTS strength NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
