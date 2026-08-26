-- Named-outcome wagers (player_pick and team_pick) record their winning option
-- in the wager status, e.g. "Settled — Begho Wins".
ALTER TABLE public.wagers DROP CONSTRAINT IF EXISTS wagers_status_check;

ALTER TABLE public.wagers ADD CONSTRAINT wagers_status_check
  CHECK (
    status = 'Active'
    OR status = 'Settled'
    OR status = 'Cancelled'
    OR status LIKE 'Settled — %'
  );
