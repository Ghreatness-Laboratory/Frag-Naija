-- Keep the public athletes read model in sync with the fields selected by the
-- application. This deliberately uses only public tables and auth.users.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS overall_rating NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aggression NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weaknesses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS jersey_number TEXT;

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'achievements' AND policyname = 'achievements_public_read'
  ) THEN
    CREATE POLICY achievements_public_read ON public.achievements FOR SELECT USING (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
