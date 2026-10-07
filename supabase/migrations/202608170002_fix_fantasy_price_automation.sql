-- Replace the placeholder ₦750,000 fantasy price with rating-tiered automatic pricing.
-- This runs once for the existing roster and keeps future inserts/rating changes in sync.
CREATE OR REPLACE FUNCTION public.calculate_fantasy_price_from_rating(rating_value NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  rating NUMERIC := LEAST(100, GREATEST(0, COALESCE(rating_value, 0)));
  min_rating NUMERIC;
  max_rating NUMERIC;
  min_price NUMERIC;
  max_price NUMERIC;
  raw_price NUMERIC;
BEGIN
  IF rating >= 95 THEN min_rating := 95; max_rating := 100; min_price := 2600000; max_price := 3800000;
  ELSIF rating >= 90 THEN min_rating := 90; max_rating := 94; min_price := 1600000; max_price := 2500000;
  ELSIF rating >= 85 THEN min_rating := 85; max_rating := 89; min_price := 1000000; max_price := 1550000;
  ELSIF rating >= 80 THEN min_rating := 80; max_rating := 84; min_price := 650000; max_price := 950000;
  ELSIF rating >= 75 THEN min_rating := 75; max_rating := 79; min_price := 500000; max_price := 620000;
  ELSIF rating >= 70 THEN min_rating := 70; max_rating := 74; min_price := 380000; max_price := 680000;
  ELSIF rating >= 60 THEN min_rating := 60; max_rating := 69; min_price := 180000; max_price := 370000;
  ELSE min_rating := 0; max_rating := 59; min_price := 70000; max_price := 170000;
  END IF;

  raw_price := min_price + (max_price - min_price) * ((rating - min_rating) / GREATEST(1, max_rating - min_rating));
  RETURN ROUND(raw_price / 1000) * 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.set_athlete_fantasy_price()
RETURNS trigger AS $$
DECLARE
  rating_value NUMERIC := COALESCE(NEW.overall_rating, NEW.rating, 0);
  base_price NUMERIC;
  nudge NUMERIC;
BEGIN
  base_price := public.calculate_fantasy_price_from_rating(rating_value);
  nudge := (('x' || SUBSTRING(MD5(COALESCE(NEW.id::TEXT, NEW.ign, NEW.name, 'athlete')), 1, 6))::bit(24)::int % 997) - 498;
  NEW.fantasy_price := GREATEST(70000, LEAST(3800000, base_price + nudge));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS athletes_fantasy_price_auto ON public.athletes;
CREATE TRIGGER athletes_fantasy_price_auto
BEFORE INSERT OR UPDATE OF rating, overall_rating, kills, assists, damage, winrate, attack, defense, survival, iq, clutch, aggression, game_slug
ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.set_athlete_fantasy_price();

UPDATE public.athletes
SET fantasy_price = GREATEST(70000, LEAST(3800000, public.calculate_fantasy_price_from_rating(COALESCE(overall_rating, rating, 0))
  + ((('x' || SUBSTRING(MD5(COALESCE(id::TEXT, ign, name, 'athlete')), 1, 6))::bit(24)::int % 997) - 498)));

CREATE OR REPLACE VIEW public.fantasy_global_leaderboard AS
SELECT
  id AS athlete_id,
  COALESCE(known_name, ign, name) AS display_name,
  total_fantasy_points,
  recent_fantasy_points,
  RANK() OVER (ORDER BY total_fantasy_points DESC, recent_fantasy_points DESC, COALESCE(known_name, ign, name) ASC) AS rank
FROM public.athletes
ORDER BY total_fantasy_points DESC, recent_fantasy_points DESC, display_name ASC;

CREATE OR REPLACE VIEW public.fantasy_squad_leaderboard AS
SELECT
  id AS squad_id,
  user_id,
  gameweek_id,
  total_points,
  gameweek_points,
  RANK() OVER (ORDER BY total_points DESC, gameweek_points DESC, updated_at ASC) AS rank
FROM public.fantasy_squads
ORDER BY total_points DESC, gameweek_points DESC, updated_at ASC;
