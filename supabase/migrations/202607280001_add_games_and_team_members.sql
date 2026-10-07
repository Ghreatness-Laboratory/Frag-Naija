CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add FC Mobile and Chess support across game-scoped records.

DO $$
DECLARE
  allowed_games text := '''pubg-mobile'', ''free-fire'', ''cod-mobile'', ''ea-fc-26'', ''mortal-kombat'', ''efootball'', ''mobile-legends'', ''fc-mobile'', ''chess''';
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['athletes', 'teams', 'tournaments', 'wagers', 'transfers', 'shop_items', 'communities'] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', tbl, tbl || '_game_slug_check');
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (game_slug IS NULL OR game_slug IN (%s))', tbl, tbl || '_game_slug_check', allowed_games);
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  role text NOT NULL,
  bio text,
  photo_url text,
  currently_playing_game_slug text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  twitch_url text,
  youtube_url text,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'Published' CHECK (status IN ('Draft', 'Published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT team_members_currently_playing_game_slug_check CHECK (
    currently_playing_game_slug IS NULL OR currently_playing_game_slug IN ('pubg-mobile', 'free-fire', 'cod-mobile', 'ea-fc-26', 'mortal-kombat', 'efootball', 'mobile-legends', 'fc-mobile', 'chess')
  )
);

CREATE INDEX IF NOT EXISTS team_members_status_sort_idx ON public.team_members(status, sort_order);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_public_read" ON public.team_members;
DROP POLICY IF EXISTS "team_members_admin_write" ON public.team_members;
CREATE POLICY "team_members_public_read" ON public.team_members FOR SELECT USING (status = 'Published');
CREATE POLICY "team_members_admin_write" ON public.team_members FOR ALL USING (false);
