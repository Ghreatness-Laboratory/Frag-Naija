-- Allow admins to finalize Gaming Alerts results with partial placement details.
ALTER TABLE public.match_results
  ALTER COLUMN winner_name DROP NOT NULL,
  ALTER COLUMN mvp_name DROP NOT NULL;
