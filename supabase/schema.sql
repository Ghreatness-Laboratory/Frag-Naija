-- ═══════════════════════════════════════════════════════════════════════════
-- Frag Naija — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL editor to initialise the database.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TEAMS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  region      TEXT,
  wins        INT  DEFAULT 0,
  losses      INT  DEFAULT 0,
  kills       INT  DEFAULT 0,
  bio         TEXT,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_public_read"  ON teams FOR SELECT USING (true);
CREATE POLICY "teams_admin_write"  ON teams FOR ALL   USING (false); -- enforced at app layer

-- ─── ATHLETES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athletes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  ign         TEXT NOT NULL,        -- In-game name
  team        TEXT REFERENCES teams(name) ON UPDATE CASCADE ON DELETE SET NULL,
  role        TEXT,                 -- e.g. IGL, Fragger, Support
  rating      NUMERIC(4,1) DEFAULT 0,
  kills       INT  DEFAULT 0,
  assists     INT  DEFAULT 0,
  damage      INT  DEFAULT 0,
  winrate     NUMERIC(5,2) DEFAULT 0,
  attack      NUMERIC(5,2) DEFAULT 0,
  defense     NUMERIC(5,2) DEFAULT 0,
  survival    NUMERIC(5,2) DEFAULT 0,
  iq          NUMERIC(5,2) DEFAULT 0,
  clutch      NUMERIC(5,2) DEFAULT 0,
  photo_url   TEXT,
  status      TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Free Agent')),
  bio         TEXT,
  known_name  TEXT,
  previous_aliases JSONB DEFAULT '[]'::jsonb,
  previous_teams   JSONB DEFAULT '[]'::jsonb,
  achievements     JSONB DEFAULT '[]'::jsonb,
  performance_history JSONB DEFAULT '[]'::jsonb,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS attack NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS defense NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS survival NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS iq NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS clutch NUMERIC(5,2) DEFAULT 0;

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes_public_read"  ON athletes FOR SELECT USING (true);
CREATE POLICY "athletes_admin_write"  ON athletes FOR ALL   USING (false);

-- ─── TRANSFERS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transfers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id  UUID REFERENCES athletes(id) ON DELETE CASCADE,
  from_team   TEXT,
  to_team     TEXT,
  fee         NUMERIC(12,2),
  status      TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rumour')),
  date        DATE DEFAULT CURRENT_DATE,
  notes       TEXT,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transfers_public_read"  ON transfers FOR SELECT USING (true);
CREATE POLICY "transfers_admin_write"  ON transfers FOR ALL   USING (false);

-- ─── TOURNAMENTS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tournaments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  game        TEXT DEFAULT 'PUBG Mobile',
  prize_pool  NUMERIC(12,2),
  currency    TEXT DEFAULT 'NGN',
  start_date  DATE,
  end_date    DATE,
  status      TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Live', 'Completed')),
  format      TEXT,                 -- e.g. Battle Royale, TDMS
  region      TEXT DEFAULT 'Nigeria',
  image_url   TEXT,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_public_read"  ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_admin_write"  ON tournaments FOR ALL   USING (false);

-- ─── WAGERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wagers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    TEXT NOT NULL,
  subtitle    TEXT,
  yes_odds    NUMERIC(6,2) DEFAULT 1.60,
  no_odds     NUMERIC(6,2) DEFAULT 2.63,
  yes_price   INT DEFAULT 62,        -- probability price (YES + NO = 100)
  no_price    INT DEFAULT 38,
  pool_total  NUMERIC(12,2) DEFAULT 0,
  hot         BOOLEAN DEFAULT false,
  status      TEXT DEFAULT 'Active'
                CHECK (status IN ('Active', 'Settled — YES Wins', 'Settled — NO Wins', 'Cancelled')),
  closes_at   TIMESTAMPTZ NOT NULL,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wagers ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

ALTER TABLE wagers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wagers_public_read"  ON wagers FOR SELECT USING (true);
CREATE POLICY "wagers_admin_write"  ON wagers FOR ALL   USING (false);

-- ─── WAGER BETS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wager_bets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wager_id    UUID NOT NULL REFERENCES wagers(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  selection   TEXT NOT NULL CHECK (selection IN ('YES', 'NO')),
  amount      NUMERIC(12,2) NOT NULL,
  potential   NUMERIC(12,2) NOT NULL,
  reference   TEXT NOT NULL UNIQUE,  -- Paystack reference (idempotency key)
  status      TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Won', 'Lost', 'Refunded')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wager_bets ENABLE ROW LEVEL SECURITY;
-- Users can only read their own bets
CREATE POLICY "bets_own_read"    ON wager_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bets_admin_write" ON wager_bets FOR ALL   USING (false);

-- ─── WALLETS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance     NUMERIC(12,2) DEFAULT 0,
  total_won   NUMERIC(12,2) DEFAULT 0,
  total_lost  NUMERIC(12,2) DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_own_read"   ON wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_admin_all"  ON wallets FOR ALL   USING (false);

-- ─── WALLET TRANSACTIONS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wager_id    UUID REFERENCES wagers(id) ON DELETE SET NULL,
  bet_id      UUID REFERENCES wager_bets(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('Stake', 'Payout', 'Refund', 'Adjustment', 'Withdrawal')),
  amount      NUMERIC(12,2) NOT NULL, -- negative for stake, positive for payout/refund
  currency    TEXT DEFAULT 'NGN',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_tx_own_read"   ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_tx_admin_all"  ON wallet_transactions FOR ALL   USING (false);

-- ─── HIGHLIGHTS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS highlights (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  player      TEXT,
  team        TEXT,
  category    TEXT DEFAULT 'Clutch' CHECK (category IN ('Clutch', 'Squad Wipe', 'Solo vs Squad', 'Commander Cam', 'Tournament')),
  thumbnail   TEXT,
  video_url   TEXT,
  views       INT DEFAULT 0,
  date        DATE DEFAULT CURRENT_DATE,
  featured    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights_public_read"  ON highlights FOR SELECT USING (true);
CREATE POLICY "highlights_admin_write"  ON highlights FOR ALL   USING (false);

-- ─── RPC FUNCTIONS ────────────────────────────────────────────────────────────

-- Atomically increment the wager pool total
CREATE OR REPLACE FUNCTION increment_wager_pool(wager_id UUID, amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wagers
  SET pool_total = pool_total + amount
  WHERE id = wager_id;
END;
$$;

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference       TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL DEFAULT 'deposit'
                    CHECK (type IN ('deposit', 'credit', 'debit')),
  amount_paid     NUMERIC(12,2) NOT NULL,
  fee             NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_credited NUMERIC(12,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('pending', 'completed', 'failed', 'suspicious')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_own_read"    ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_admin_write" ON transactions FOR ALL   USING (false);

-- ─── PLATFORM SETTINGS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read"  ON platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write"  ON platform_settings FOR ALL   USING (false);

-- Default settings (idempotent)
INSERT INTO platform_settings (key, value) VALUES
  ('min_deposit_ngn',      '500'),
  ('platform_fee_percent', '10'),
  ('deposits_enabled',     'true'),
  ('usd_ngn_rate',         '1600'),
  ('max_payout_usd',       '2000')
ON CONFLICT (key) DO NOTHING;

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run these in Supabase Dashboard > Storage > New Bucket, or via the API.
-- They cannot be created via SQL directly.

-- Bucket: athletes  (public)
-- Bucket: teams     (public)
-- Bucket: highlights (public)

-- ─── SHOP ITEMS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) DEFAULT 0,
  currency    TEXT DEFAULT 'NGN',
  image_url   TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS game_slug TEXT DEFAULT 'pubg-mobile';

-- One-time backfill for records created before game isolation existed.
UPDATE athletes    SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE teams       SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE tournaments SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE wagers      SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE transfers   SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';
UPDATE shop_items  SET game_slug = 'pubg-mobile' WHERE game_slug IS NULL OR game_slug = '';

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_items_public_read" ON shop_items FOR SELECT USING (status = 'Published');
CREATE POLICY "shop_items_admin_write" ON shop_items FOR ALL USING (false);
