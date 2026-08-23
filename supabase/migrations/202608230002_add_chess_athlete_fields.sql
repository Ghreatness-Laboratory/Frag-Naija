-- Chess ratings are manual Elo values; they are not derived from combat stats.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS chess_rating INTEGER,
  ADD COLUMN IF NOT EXISTS chess_title TEXT,
  ADD COLUMN IF NOT EXISTS chess_peak_rating INTEGER,
  ADD COLUMN IF NOT EXISTS chess_wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chess_draws INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chess_losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS federation TEXT;

ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_chess_rating_check;
ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_chess_rating_check
  CHECK (chess_rating IS NULL OR chess_rating >= 100);

ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_chess_title_check;
ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_chess_title_check
  CHECK (chess_title IS NULL OR chess_title IN ('GM', 'IM', 'FM', 'CM', 'WGM', 'WIM', 'Untitled'));
