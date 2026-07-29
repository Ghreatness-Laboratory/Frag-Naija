-- Speed up the neutral homepage/dashboard data bundle.
-- These indexes match the fields used for top athlete, team ranking, active wager,
-- transfer, and tournament summaries.
CREATE INDEX IF NOT EXISTS athletes_overall_rating_idx ON athletes (overall_rating DESC);
CREATE INDEX IF NOT EXISTS athletes_game_slug_overall_rating_idx ON athletes (game_slug, overall_rating DESC);
CREATE INDEX IF NOT EXISTS teams_rank_idx ON teams (rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS teams_game_slug_rank_idx ON teams (game_slug, rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS wagers_status_hot_closes_at_idx ON wagers (status, hot DESC, closes_at ASC);
CREATE INDEX IF NOT EXISTS transfers_date_idx ON transfers (date DESC);
CREATE INDEX IF NOT EXISTS tournaments_status_start_date_idx ON tournaments (status, start_date ASC);
