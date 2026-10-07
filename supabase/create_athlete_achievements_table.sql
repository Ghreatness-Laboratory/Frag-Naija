-- Fix athlete achievements storage. Achievements are related rows, not columns on athletes.
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'achievements_public_read'
  ) THEN
    CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'achievements_admin_write'
  ) THEN
    CREATE POLICY "achievements_admin_write" ON achievements FOR ALL USING (false);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'achievements'
  ) THEN
    EXECUTE $migrate$
      INSERT INTO achievements (athlete_id, title, date)
      SELECT
        a.id,
        COALESCE(item->>'title', ''),
        COALESCE(item->>'date', '')
      FROM athletes a
      CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(a.achievements) = 'array' THEN a.achievements ELSE '[]'::jsonb END) AS item
      WHERE (COALESCE(item->>'title', '') <> '' OR COALESCE(item->>'date', '') <> '')
      ON CONFLICT DO NOTHING
    $migrate$;
  END IF;
END $$;

ALTER TABLE athletes DROP COLUMN IF EXISTS achievements;
NOTIFY pgrst, 'reload schema';
