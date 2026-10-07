-- Marketplace listings are owned by Supabase Auth users, not athlete profiles.
ALTER TABLE public.athlete_marketplace_listings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS ign TEXT,
  ADD COLUMN IF NOT EXISTS game_slug TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.athlete_marketplace_listings
  ALTER COLUMN athlete_id DROP NOT NULL;

ALTER TABLE public.athlete_marketplace_listings
  ADD CONSTRAINT athlete_marketplace_listings_user_id_key UNIQUE (user_id);

CREATE INDEX IF NOT EXISTS athlete_marketplace_listings_game_slug_idx
  ON public.athlete_marketplace_listings (game_slug);

NOTIFY pgrst, 'reload schema';
