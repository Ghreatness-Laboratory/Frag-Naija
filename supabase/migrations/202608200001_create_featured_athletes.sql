CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS featured_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_featured_athletes_sort_order ON featured_athletes(sort_order);

ALTER TABLE featured_athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "featured_athletes_public_read" ON featured_athletes FOR SELECT USING (true);
CREATE POLICY "featured_athletes_admin_write" ON featured_athletes FOR ALL USING (false);

NOTIFY pgrst, 'reload schema';
