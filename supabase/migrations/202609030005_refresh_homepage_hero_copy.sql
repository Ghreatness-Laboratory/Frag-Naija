UPDATE public.homepage_settings
SET
  hero_headline = 'The Complete Esports Ecosystem',
  hero_tagline = 'Bringing everything together in one place.',
  updated_at = now();

NOTIFY pgrst, 'reload schema';
