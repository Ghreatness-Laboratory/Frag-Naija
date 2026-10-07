ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS featured_on_home boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS wagers_home_featured_idx ON public.wagers(status, featured_on_home, hot DESC, closes_at ASC);
