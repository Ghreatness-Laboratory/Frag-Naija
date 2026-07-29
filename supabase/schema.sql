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
  performance_history JSONB DEFAULT '[]'::jsonb,
  sensitivity_settings JSONB DEFAULT '{}'::jsonb,
  control_code TEXT,
  game_slug   TEXT DEFAULT 'pubg-mobile',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS attack NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS defense NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS survival NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS iq NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS clutch NUMERIC(5,2) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS sensitivity_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS control_code TEXT;

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes_public_read"  ON athletes FOR SELECT USING (true);
CREATE POLICY "athletes_admin_write"  ON athletes FOR ALL   USING (false);

-- ─── ATHLETE ACHIEVEMENTS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id  UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  date        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_admin_write" ON achievements FOR ALL USING (false);

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
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'local';

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_public_read"  ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_admin_write"  ON tournaments FOR ALL   USING (false);

-- ─── TOURNAMENT RESULTS / TEAM POWER POINTS ────────────────────────────────

CREATE TABLE IF NOT EXISTS tournament_results (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  placement      TEXT NOT NULL DEFAULT 'participated',
  points_earned  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, team_id)
);

CREATE OR REPLACE FUNCTION calculate_tournament_result_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  tournament_tier TEXT;
  tournament_prize NUMERIC;
  tier_multiplier NUMERIC;
  placement_multiplier NUMERIC;
BEGIN
  SELECT COALESCE(tier, 'local'), COALESCE(prize_pool, 0)
  INTO tournament_tier, tournament_prize
  FROM tournaments
  WHERE id = NEW.tournament_id;

  tier_multiplier := CASE lower(tournament_tier)
    WHEN 'international' THEN 5
    WHEN 'national' THEN 3
    WHEN 'regional' THEN 2
    WHEN 'state' THEN 1.5
    ELSE 1
  END;

  placement_multiplier := CASE lower(NEW.placement)
    WHEN '1st' THEN 1
    WHEN 'first' THEN 1
    WHEN 'winner' THEN 1
    WHEN 'champion' THEN 1
    WHEN '2nd' THEN 0.7
    WHEN 'second' THEN 0.7
    WHEN 'runner-up' THEN 0.7
    WHEN '3rd' THEN 0.5
    WHEN 'third' THEN 0.5
    WHEN 'semi-finalist' THEN 0.3
    WHEN 'semifinalist' THEN 0.3
    WHEN 'quarter-finalist' THEN 0.2
    WHEN 'quarterfinalist' THEN 0.2
    ELSE 0.1
  END;

  -- Formula: tier multiplier × prize pool scale × placement multiplier.
  -- Prize pool is scaled by ₦100,000 so local low/no-prize events still earn baseline points.
  NEW.points_earned := ROUND(tier_multiplier * GREATEST(tournament_prize / 100000, 1) * placement_multiplier, 2);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournament_results_points_trigger ON tournament_results;
CREATE TRIGGER tournament_results_points_trigger
BEFORE INSERT OR UPDATE OF tournament_id, placement
ON tournament_results
FOR EACH ROW
EXECUTE FUNCTION calculate_tournament_result_points();

ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournament_results_public_read" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "tournament_results_admin_write" ON tournament_results FOR ALL USING (false);

-- ─── WAGERS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wagers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    TEXT NOT NULL,
  subtitle    TEXT,
  match_name  TEXT DEFAULT '',
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
ALTER TABLE wagers ADD COLUMN IF NOT EXISTS match_name TEXT DEFAULT '';

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

-- ─── HOMEPAGE SETTINGS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_settings_public_read" ON homepage_settings FOR SELECT USING (true);
CREATE POLICY "homepage_settings_admin_write" ON homepage_settings FOR ALL USING (false);

INSERT INTO homepage_settings (key, value) VALUES
  ('hero_eyebrow', 'NIGERIA''S PREMIERE ESPORTS PLATFORM'),
  ('hero_headline', 'FRAG NAIJA'),
  ('hero_tagline', 'Nigeria''s premier esports command platform. Scout top athletes, track teams, enter tournaments, and follow wagers across every supported game.'),
  ('stat_players', '1,242+'),
  ('stat_tournaments', '48'),
  ('stat_championships', '12'),
  ('stat_prize_pool', '₦17.2M'),
  ('recruitment_headline', 'RECRUITMENT OPEN'),
  ('recruitment_body', 'JOIN FRAG NAIJA AND GET RANKED IN THE OPEN TRIALS.'),
  ('recruitment_cta', 'JOIN THE RANKS'),
  ('popup_title', ''),
  ('popup_body', ''),
  ('popup_cta', ''),
  ('featured_athlete_ids', ''),
  ('featured_team_ids', ''),
  ('featured_tournament_ids', '')
ON CONFLICT (key) DO NOTHING;

-- ─── HOMEPAGE FEATURED ITEMS ───────────────────────────────────────────────
-- Existing app code uses the `featured` table for homepage/admin curation.
-- The type check includes organization alongside athlete/team/tournament.

CREATE TABLE IF NOT EXISTS featured (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL CHECK (type IN ('athlete', 'team', 'tournament', 'organization', 'wager', 'match', 'news')),
  ref_id      UUID,
  label       TEXT NOT NULL DEFAULT '',
  badge       TEXT,
  priority    INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE featured ENABLE ROW LEVEL SECURITY;
CREATE POLICY "featured_public_read" ON featured FOR SELECT USING (is_active = true);
CREATE POLICY "featured_admin_write" ON featured FOR ALL USING (false);

-- ─── ESPORTS ORGANIZATIONS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  logo_url     TEXT,
  region       TEXT,
  founded_year INTEGER,
  founded_date DATE,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  date            DATE,
  game_slug       TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT USING (true);
CREATE POLICY "organizations_admin_write" ON organizations FOR ALL USING (false);
CREATE POLICY "organization_achievements_public_read" ON organization_achievements FOR SELECT USING (true);
CREATE POLICY "organization_achievements_admin_write" ON organization_achievements FOR ALL USING (false);

-- ─── GAME SLUG CHECKS ───────────────────────────────────────────────────────
DO $$
DECLARE
  allowed_games text := '''pubg-mobile'', ''free-fire'', ''cod-mobile'', ''ea-fc-26'', ''mortal-kombat'', ''efootball'', ''mobile-legends'', ''fc-mobile'', ''blood-strike''';
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['athletes', 'teams', 'tournaments', 'wagers', 'transfers', 'shop_items', 'communities'] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', tbl, tbl || '_game_slug_check');
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (game_slug IS NULL OR game_slug IN (%s))', tbl, tbl || '_game_slug_check', allowed_games);
    END IF;
  END LOOP;
END $$;

-- ─── TEAM MEMBERS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  currently_playing_game_slug TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  twitch_url TEXT,
  youtube_url TEXT,
  sort_order INT DEFAULT 0,
  status TEXT DEFAULT 'Published' CHECK (status IN ('Draft', 'Published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT team_members_currently_playing_game_slug_check CHECK (
    currently_playing_game_slug IS NULL OR currently_playing_game_slug IN ('pubg-mobile', 'free-fire', 'cod-mobile', 'ea-fc-26', 'mortal-kombat', 'efootball', 'mobile-legends', 'fc-mobile', 'blood-strike')
  )
);

CREATE INDEX IF NOT EXISTS team_members_status_sort_idx ON team_members(status, sort_order);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_public_read" ON team_members FOR SELECT USING (status = 'Published');
CREATE POLICY "team_members_admin_write" ON team_members FOR ALL USING (false);
