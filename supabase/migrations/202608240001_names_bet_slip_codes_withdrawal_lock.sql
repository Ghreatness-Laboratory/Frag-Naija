ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.wager_bets
  ADD COLUMN IF NOT EXISTS slip_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_id UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS wager_bets_slip_code_key ON public.wager_bets (slip_code) WHERE slip_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wager_bets_verification_id_key ON public.wager_bets (verification_id) WHERE verification_id IS NOT NULL;

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,
  ADD COLUMN IF NOT EXISTS funding_bank_code TEXT,
  ADD COLUMN IF NOT EXISTS funding_account_number TEXT,
  ADD COLUMN IF NOT EXISTS funding_account_name TEXT,
  ADD COLUMN IF NOT EXISTS gateway_authorization JSONB;
