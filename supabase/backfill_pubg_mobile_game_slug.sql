-- One-time game isolation backfill for records created before game_slug existed.
-- Run in Supabase SQL editor. The first SELECT reports the rows that will be tagged;
-- the final SELECT verifies no missing game_slug values remain and reports PUBG rows.

WITH before_counts AS (
  SELECT 'athletes' AS table_name, count(*) FILTER (WHERE game_slug IS NULL OR game_slug = '') AS missing_game_slug, count(*) FILTER (WHERE game_slug = 'pubg-mobile') AS pubg_mobile_rows FROM athletes
  UNION ALL SELECT 'teams', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM teams
  UNION ALL SELECT 'tournaments', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM tournaments
  UNION ALL SELECT 'wagers', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM wagers
  UNION ALL SELECT 'transfers', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM transfers
  UNION ALL SELECT 'shop_items', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM shop_items
)
SELECT 'before' AS phase, * FROM before_counts ORDER BY table_name;

UPDATE athletes    SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE teams       SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE tournaments SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE wagers      SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE transfers   SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE shop_items  SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';

WITH after_counts AS (
  SELECT 'athletes' AS table_name, count(*) FILTER (WHERE game_slug IS NULL OR game_slug = '') AS missing_game_slug, count(*) FILTER (WHERE game_slug = 'pubg-mobile') AS pubg_mobile_rows FROM athletes
  UNION ALL SELECT 'teams', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM teams
  UNION ALL SELECT 'tournaments', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM tournaments
  UNION ALL SELECT 'wagers', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM wagers
  UNION ALL SELECT 'transfers', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM transfers
  UNION ALL SELECT 'shop_items', count(*) FILTER (WHERE game_slug IS NULL OR game_slug = ''), count(*) FILTER (WHERE game_slug = 'pubg-mobile') FROM shop_items
)
SELECT 'after' AS phase, * FROM after_counts ORDER BY table_name;
