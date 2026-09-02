-- Athlete accounts are explicitly linked to the Supabase Auth identity that owns them.
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS athletes_user_id_unique ON public.athletes (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.athlete_marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL UNIQUE REFERENCES public.athletes(id) ON DELETE CASCADE,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  pending_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  public_data JSONB,
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS athlete_marketplace_listings_review_status_idx ON public.athlete_marketplace_listings (review_status);
ALTER TABLE public.athlete_marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace_public_approved_read" ON public.athlete_marketplace_listings FOR SELECT USING (review_status = 'approved');
NOTIFY pgrst, 'reload schema';
