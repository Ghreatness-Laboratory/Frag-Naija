-- Adds nullable game_slug columns and constraints/indexes for game-scoped content.
-- Existing records are intentionally left NULL until an admin confirms their default game.

DO $$
DECLARE
  valid_slugs text[] := ARRAY['pubg-mobile','free-fire','cod-mobile','ea-fc-26','mortal-kombat','efootball','mobile-legends'];
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['athletes','teams','tournaments','wagers','transfers','shop_items']
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS game_slug text', table_name);
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', table_name, table_name || '_game_slug_check');
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (game_slug IS NULL OR game_slug = ANY (%L::text[]))', table_name, table_name || '_game_slug_check', valid_slugs);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (game_slug)', table_name || '_game_slug_idx', table_name);
  END LOOP;
END $$;

-- Run before any backfill and share the counts for confirmation:
SELECT 'athletes' AS table_name, count(*) AS missing_game_slug FROM athletes WHERE game_slug IS NULL OR game_slug = ''
UNION ALL SELECT 'teams', count(*) FROM teams WHERE game_slug IS NULL OR game_slug = ''
UNION ALL SELECT 'tournaments', count(*) FROM tournaments WHERE game_slug IS NULL OR game_slug = ''
UNION ALL SELECT 'wagers', count(*) FROM wagers WHERE game_slug IS NULL OR game_slug = ''
UNION ALL SELECT 'transfers', count(*) FROM transfers WHERE game_slug IS NULL OR game_slug = ''
UNION ALL SELECT 'shop_items', count(*) FROM shop_items WHERE game_slug IS NULL OR game_slug = '';
