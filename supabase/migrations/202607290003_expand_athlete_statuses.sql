-- Expand athlete statuses to the exact admin-controlled public labels.
ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_status_check;
ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_status_check
  CHECK (status IN ('Active', 'Inactive', 'Banned', 'Free Agent', 'Suspended', 'Dead'));
