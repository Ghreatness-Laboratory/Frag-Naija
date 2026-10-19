-- ==============================================================================
-- FC Mobile Fantasy League: Let Everyone Pick Again
-- Opens transfer window with full transfers, sets allow_repick flag,
-- and resets FC Mobile fantasy squads so all users pick fresh.
-- ==============================================================================

INSERT INTO public.fantasy_settings (key, value, updated_at)
VALUES 
  ('fc_mobile_transfer_window', '{"gameSlug":"fc-mobile","status":"open","transfersRemaining":6,"opens":"2026-10-19T00:00:00Z","closes":""}'::jsonb, timezone('utc'::text, now())),
  ('fc_mobile_allow_repick', 'true'::jsonb, timezone('utc'::text, now())),
  ('fc_mobile_reset_at', to_jsonb(timezone('utc'::text, now())::text), timezone('utc'::text, now()))
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = timezone('utc'::text, now());

-- Clear previous FC Mobile fantasy squads so all managers start clean
DELETE FROM public.fantasy_squads
WHERE game_slug = 'fc-mobile';
