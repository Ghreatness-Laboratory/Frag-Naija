ALTER TABLE public.athlete_marketplace_listings
  ADD COLUMN IF NOT EXISTS highlight_requested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_granted BOOLEAN NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
