-- Complete tournament detail fields used by the public tournament details view.
ALTER TABLE public.tournaments
  ALTER COLUMN start_date TYPE timestamptz USING start_date::timestamptz,
  ALTER COLUMN end_date TYPE timestamptz USING end_date::timestamptz;

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS rules_overview text,
  ADD COLUMN IF NOT EXISTS participant_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot_count integer,
  ADD COLUMN IF NOT EXISTS registration_instructions text,
  ADD COLUMN IF NOT EXISTS watch_url text,
  ADD COLUMN IF NOT EXISTS access_instructions text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_participant_count_check,
  ADD CONSTRAINT tournaments_participant_count_check CHECK (participant_count >= 0),
  DROP CONSTRAINT IF EXISTS tournaments_slot_count_check,
  ADD CONSTRAINT tournaments_slot_count_check CHECK (slot_count IS NULL OR slot_count >= 0);

COMMENT ON COLUMN public.tournaments.rules_overview IS 'Public format and rules overview displayed in tournament details.';
COMMENT ON COLUMN public.tournaments.registration_instructions IS 'Public joining/registering instructions for Upcoming tournaments.';
COMMENT ON COLUMN public.tournaments.watch_url IS 'Public stream or broadcast URL for Live tournaments.';
COMMENT ON COLUMN public.tournaments.access_instructions IS 'Participant access instructions for Live tournaments, such as room or check-in guidance.';
COMMENT ON COLUMN public.tournaments.metadata IS 'Additional tournament metadata that does not require a dedicated column.';
