-- Keep announcement popup content in the public Supabase homepage settings table.
-- Do not touch legacy Django auth_user or frag_api_* tables.
ALTER TABLE public.homepage_settings
  ADD COLUMN IF NOT EXISTS popup_enabled TEXT DEFAULT 'false',
  ADD COLUMN IF NOT EXISTS popup_image_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS popup_cta_link TEXT DEFAULT '';
