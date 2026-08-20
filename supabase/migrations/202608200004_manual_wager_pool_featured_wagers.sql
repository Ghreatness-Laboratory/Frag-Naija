-- Wager stake pools are now manually controlled by admins through public.wagers.pool_total.
-- Keep the historical RPC for callers, but make it a no-op so user stakes never recalculate
-- the public Stake Pool display behind the admin's back.
CREATE OR REPLACE FUNCTION public.increment_wager_pool(wager_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.wagers ADD COLUMN IF NOT EXISTS featured_on_home boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS wagers_home_featured_idx ON public.wagers(status, featured_on_home, hot DESC, closes_at ASC);
CREATE INDEX IF NOT EXISTS wagers_manual_pool_idx ON public.wagers(pool_total DESC);
CREATE INDEX IF NOT EXISTS wagers_trade_count_idx ON public.wagers(trade_count DESC);
