-- Remove Blood Strike and add Chess to game slug checks.
-- IMPORTANT: Before applying this migration to production, take and verify a
-- full database backup/export. The migration emits NOTICE lines with the row
-- counts it will delete before deleting Blood Strike-scoped records.

DO $$
DECLARE
  allowed_slugs text := '''pubg-mobile'', ''free-fire'', ''cod-mobile'', ''ea-fc-26'', ''mortal-kombat'', ''efootball'', ''mobile-legends'', ''fc-mobile'', ''chess''';
  constraint_row record;
  table_row record;
  row_count bigint;
BEGIN
  FOR constraint_row IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%blood-strike%'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', constraint_row.table_name, constraint_row.conname);
  END LOOP;

  FOR table_row IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'game_slug'
      AND table_name IN ('athletes', 'teams', 'tournaments', 'wagers', 'transfers', 'shop_items', 'custom_wagers', 'duel_matches', 'communities')
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (game_slug IS NULL OR game_slug IN (%s))',
      table_row.table_name,
      table_row.table_name || '_game_slug_check',
      allowed_slugs
    );
  END LOOP;

  IF to_regclass('public.tournaments') IS NOT NULL THEN
    ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_game_check CHECK (game IN ('PUBG Mobile', 'Free Fire', 'Call of Duty Mobile', 'EA FC 26', 'Mortal Kombat', 'eFootball', 'Mobile Legends', 'FC Mobile', 'Chess'));
  END IF;

  IF to_regclass('public.team_members') IS NOT NULL THEN
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_currently_playing_game_slug_check CHECK (
      currently_playing_game_slug IS NULL OR currently_playing_game_slug IN ('pubg-mobile', 'free-fire', 'cod-mobile', 'ea-fc-26', 'mortal-kombat', 'efootball', 'mobile-legends', 'fc-mobile', 'chess')
    );
  END IF;

  FOR table_row IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'game_slug'
      AND table_name IN ('athletes', 'teams', 'tournaments', 'wagers', 'custom_wagers', 'duel_matches', 'shop_items', 'communities')
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE game_slug = %L', table_row.table_name, 'blood-strike') INTO row_count;
    RAISE NOTICE 'Blood Strike rows to delete from %: %', table_row.table_name, row_count;
  END LOOP;

  IF to_regclass('public.tournament_matches') IS NOT NULL AND to_regclass('public.tournaments') IS NOT NULL THEN
    SELECT COUNT(*) INTO row_count FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE t.game_slug = 'blood-strike' OR t.game = 'Blood Strike';
    RAISE NOTICE 'Blood Strike rows to delete from tournament_matches: %', row_count;
  END IF;

  IF to_regclass('public.match_results') IS NOT NULL AND to_regclass('public.tournaments') IS NOT NULL THEN
    SELECT COUNT(*) INTO row_count FROM public.match_results mr JOIN public.tournaments t ON t.id = mr.tournament_id WHERE t.game_slug = 'blood-strike' OR t.game = 'Blood Strike';
    RAISE NOTICE 'Blood Strike rows to delete from match_results: %', row_count;
  END IF;

  IF to_regclass('public.match_results') IS NOT NULL AND to_regclass('public.tournaments') IS NOT NULL THEN
    DELETE FROM public.match_results mr USING public.tournaments t WHERE t.id = mr.tournament_id AND (t.game_slug = 'blood-strike' OR t.game = 'Blood Strike');
  END IF;

  IF to_regclass('public.tournament_matches') IS NOT NULL AND to_regclass('public.tournaments') IS NOT NULL THEN
    DELETE FROM public.tournament_matches tm USING public.tournaments t WHERE t.id = tm.tournament_id AND (t.game_slug = 'blood-strike' OR t.game = 'Blood Strike');
  END IF;

  FOR table_row IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'game_slug'
      AND table_name IN ('custom_wagers', 'duel_matches', 'wagers', 'shop_items', 'communities', 'tournaments', 'teams', 'athletes')
    ORDER BY CASE table_name
      WHEN 'custom_wagers' THEN 1 WHEN 'duel_matches' THEN 2 WHEN 'wagers' THEN 3 WHEN 'shop_items' THEN 4
      WHEN 'communities' THEN 5 WHEN 'tournaments' THEN 6 WHEN 'teams' THEN 7 WHEN 'athletes' THEN 8 ELSE 99 END
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE game_slug = %L', table_row.table_name, 'blood-strike');
  END LOOP;
END $$;
