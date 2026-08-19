-- Add game_slug column to custom_wagers for game selection
ALTER TABLE public.custom_wagers ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

-- Add proof_of_win_url column for winner proof upload at settlement
ALTER TABLE public.custom_wagers ADD COLUMN IF NOT EXISTS proof_of_win_url TEXT;

-- Update stake limits to ₦500 - ₦5,000,000
INSERT INTO public.platform_settings (key, value) VALUES
  ('custom_wager_min_stake', '500'),
  ('custom_wager_max_stake', '5000000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add index for game_slug filtering
CREATE INDEX IF NOT EXISTS custom_wagers_game_slug_idx ON public.custom_wagers (game_slug);
