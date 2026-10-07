-- Supabase owns the every-minute Match Alert trigger. Configure these
-- Vault secrets in the Supabase dashboard before this job can dispatch:
--   match_alert_scheduler_url    https://<deployed-app-origin>
--   match_alert_scheduler_secret same value as SUPABASE_MATCH_ALERT_SCHEDULER_SECRET
-- Keeping both values in Vault means neither is committed to this migration.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.invoke_match_alert_scheduler()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'match_alert_scheduler_url';

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'match_alert_scheduler_secret';

  IF coalesce(v_url, '') = '' OR coalesce(v_secret, '') = '' THEN
    RAISE EXCEPTION 'Match-alert scheduler Vault secrets are not configured.';
  END IF;

  PERFORM net.http_post(
    url := regexp_replace(v_url, '/+$', '') || '/api/internal/match-alerts/dispatch',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_match_alert_scheduler() FROM PUBLIC;

-- A repeatable migration must leave exactly one scheduler job behind.
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN SELECT jobid FROM cron.job WHERE jobname = 'fragnaija-match-alerts-every-minute'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'fragnaija-match-alerts-every-minute',
  '* * * * *',
  'SELECT public.invoke_match_alert_scheduler();'
);
