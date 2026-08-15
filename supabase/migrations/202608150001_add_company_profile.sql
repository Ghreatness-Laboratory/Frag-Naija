CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.company_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL DEFAULT 'Ghreatness Laboratory',
  company_logo text,
  eyebrow text DEFAULT 'Meet the Creators of FragNaija',
  headline text DEFAULT 'Meet the Creators of FragNaija',
  intro text,
  mission text,
  what_we_do text,
  operating_model text,
  owned_products text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_profile_public_read" ON public.company_profile;
DROP POLICY IF EXISTS "company_profile_admin_write" ON public.company_profile;
CREATE POLICY "company_profile_public_read" ON public.company_profile FOR SELECT USING (true);
CREATE POLICY "company_profile_admin_write" ON public.company_profile FOR ALL USING (false);
