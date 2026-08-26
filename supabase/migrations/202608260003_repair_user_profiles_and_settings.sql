-- Repair migration for environments where the original profile/settings migration
-- was marked as applied without creating its tables.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  referral_code TEXT UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_notification_shortcuts BOOLEAN NOT NULL DEFAULT true,
  match_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_settings TO authenticated;

DROP POLICY IF EXISTS user_profiles_own_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_insert ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_update ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_delete ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_own_read ON public.user_profiles;
DROP POLICY IF EXISTS user_settings_own_select ON public.user_settings;
DROP POLICY IF EXISTS user_settings_own_insert ON public.user_settings;
DROP POLICY IF EXISTS user_settings_own_update ON public.user_settings;
DROP POLICY IF EXISTS user_settings_own_delete ON public.user_settings;
DROP POLICY IF EXISTS user_settings_own_read ON public.user_settings;

CREATE POLICY user_profiles_own_select ON public.user_profiles
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY user_profiles_own_insert ON public.user_profiles
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_profiles_own_update ON public.user_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_profiles_own_delete ON public.user_profiles
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY user_settings_own_select ON public.user_settings
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY user_settings_own_insert ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_settings_own_update ON public.user_settings
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY user_settings_own_delete ON public.user_settings
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- The Supabase service_role has the BYPASSRLS attribute, so it remains able to
-- perform administrative operations without a broad client-facing policy.
NOTIFY pgrst, 'reload schema';
