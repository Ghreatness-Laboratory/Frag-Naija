-- Verified payout destinations are the sole withdrawal destination. All records
-- are owned by Supabase auth users; no legacy Django tables are referenced.
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  paystack_recipient_code TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bank_accounts_own_read ON public.bank_accounts;
CREATE POLICY bank_accounts_own_read ON public.bank_accounts
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
