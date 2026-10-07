CREATE TABLE IF NOT EXISTS public.fantasy_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.fantasy_settings (key, value)
VALUES
  ('pubg_transfer_window', '{"gameSlug":"pubg-mobile","status":"closed","transfersRemaining":0,"opens":"","closes":""}'::jsonb),
  ('pubg_chip_windows', '{"triple_captain":{"status":"closed","opens":"","closes":""},"manual_substitute":{"status":"closed","opens":"","closes":""}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
