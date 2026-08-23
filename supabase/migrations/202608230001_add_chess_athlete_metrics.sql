-- Chess is already an allowed game slug. These fields are intentionally nullable
-- for existing athletes from games that use combat attributes.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS chess_rating integer,
  ADD COLUMN IF NOT EXISTS chess_title text,
  ADD COLUMN IF NOT EXISTS chess_peak_rating integer,
  ADD COLUMN IF NOT EXISTS chess_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chess_draws integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chess_losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS federation text;

CREATE INDEX IF NOT EXISTS athletes_chess_rating_idx
  ON public.athletes (chess_rating DESC NULLS LAST)
  WHERE game_slug = 'chess';
