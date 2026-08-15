CREATE TABLE duel_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_slug TEXT NOT NULL DEFAULT 'pubg-mobile',
  mode TEXT NOT NULL DEFAULT 'tdm_1v1',
  player_a_id UUID NOT NULL REFERENCES athletes(id),
  player_b_id UUID NOT NULL REFERENCES athletes(id),
  player_a_rating NUMERIC,
  player_b_rating NUMERIC,
  odds_a NUMERIC NOT NULL,
  odds_b NUMERIC NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','locked','settled','cancelled')),
  winner_id UUID REFERENCES athletes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE TABLE duel_wagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID NOT NULL REFERENCES duel_matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  picked_player_id UUID NOT NULL REFERENCES athletes(id),
  stake NUMERIC NOT NULL,
  odds_at_placement NUMERIC NOT NULL,
  potential_payout NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','won','lost','cashed_out')),
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_duel_wagers_user_id ON duel_wagers(user_id);
CREATE INDEX idx_duel_wagers_duel_id ON duel_wagers(duel_id);
