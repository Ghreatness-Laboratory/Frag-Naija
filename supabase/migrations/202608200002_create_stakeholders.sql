CREATE TABLE IF NOT EXISTS public.stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  photo_url text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  twitch_url text,
  website_url text,
  sort_order integer DEFAULT 0,
  status text DEFAULT 'Published' CHECK (status IN ('Published', 'Draft')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stakeholders_status_sort_idx ON public.stakeholders(status, sort_order, created_at);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stakeholders_public_read" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_admin_write" ON public.stakeholders;
CREATE POLICY "stakeholders_public_read" ON public.stakeholders FOR SELECT USING (status = 'Published');
CREATE POLICY "stakeholders_admin_write" ON public.stakeholders FOR ALL USING (false);
