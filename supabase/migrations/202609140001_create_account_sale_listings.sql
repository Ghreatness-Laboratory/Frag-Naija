-- Account-sale listings use public tables and Supabase auth.users only.
CREATE TABLE IF NOT EXISTS public.account_sale_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_slug text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 10000),
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_array_length(image_urls) >= 1),
  asking_price numeric(12,2) NOT NULL CHECK (asking_price > 0),
  contact_preference text NOT NULL CHECK (char_length(contact_preference) BETWEEN 3 AND 1000),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  reviewer_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold')),
  final_sale_price numeric(12,2),
  fee_percent numeric(5,2),
  fee_amount numeric(12,2),
  sold_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_sale_listings_public_idx ON public.account_sale_listings (review_status, status, game_slug, asking_price, created_at DESC);
CREATE INDEX IF NOT EXISTS account_sale_listings_seller_idx ON public.account_sale_listings (seller_id, created_at DESC);
ALTER TABLE public.account_sale_listings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.platform_settings (key, value) VALUES ('account_sale_fee_percent', '10') ON CONFLICT (key) DO NOTHING;

-- Atomically marks a seller's listing sold and debits the configured platform fee.
CREATE OR REPLACE FUNCTION public.complete_account_sale(p_listing_id uuid, p_seller_id uuid, p_final_sale_price numeric)
RETURNS public.account_sale_listings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_listing public.account_sale_listings%ROWTYPE; v_fee_percent numeric; v_fee numeric;
BEGIN
  IF p_final_sale_price <= 0 THEN RAISE EXCEPTION 'Final sale price must be positive'; END IF;
  SELECT * INTO v_listing FROM public.account_sale_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.seller_id <> p_seller_id THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF v_listing.review_status <> 'approved' OR v_listing.status <> 'active' THEN RAISE EXCEPTION 'Only active approved listings can be marked sold'; END IF;
  SELECT COALESCE(NULLIF(value, '')::numeric, 10) INTO v_fee_percent FROM public.platform_settings WHERE key = 'account_sale_fee_percent';
  v_fee_percent := COALESCE(v_fee_percent, 10); v_fee := round(p_final_sale_price * v_fee_percent / 100, 2);
  UPDATE public.wallets SET balance = balance - v_fee, updated_at = now() WHERE user_id = p_seller_id AND balance >= v_fee;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient wallet balance to pay the ₦% platform fee. Top up your wallet first.', v_fee; END IF;
  INSERT INTO public.wallet_transactions (user_id, type, amount, currency, description) VALUES (p_seller_id, 'Account Sale Fee', -v_fee, 'NGN', 'Account sale platform fee for listing ' || p_listing_id);
  UPDATE public.account_sale_listings SET status='sold', final_sale_price=p_final_sale_price, fee_percent=v_fee_percent, fee_amount=v_fee, sold_at=now(), updated_at=now() WHERE id=p_listing_id RETURNING * INTO v_listing;
  RETURN v_listing;
END; $$;
REVOKE ALL ON FUNCTION public.complete_account_sale(uuid,uuid,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_account_sale(uuid,uuid,numeric) TO service_role;
NOTIFY pgrst, 'reload schema';
