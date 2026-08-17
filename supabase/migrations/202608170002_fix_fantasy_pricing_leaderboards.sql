-- Repair Fantasy League defaults so pricing and rankings are generated data, not manual placeholders.
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS fantasy_price_manual_override BOOLEAN DEFAULT false;
CREATE OR REPLACE FUNCTION public.fn_calculate_fantasy_price(
  p_rating NUMERIC,
  p_key TEXT DEFAULT ''
) RETURNS NUMERIC AS $$
DECLARE
  rating NUMERIC := LEAST(100, GREATEST(0, COALESCE(p_rating, 0)));
  min_rating NUMERIC;
  max_rating NUMERIC;
  min_price NUMERIC;
  max_price NUMERIC;
  base_price NUMERIC;
  nudge NUMERIC;
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

  base_price := ROUND((min_price + ((max_price - min_price) * ((rating - min_rating) / GREATEST(1, max_rating - min_rating)))) / 1000) * 1000;
  nudge := MOD(ABS(HASHTEXT(COALESCE(p_key, ''))), 997);
  RETURN LEAST(max_price, GREATEST(min_price, base_price + nudge));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.fn_set_athlete_fantasy_price()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.fantasy_price_manual_override, false) THEN
    RETURN NEW;
  END IF;

  NEW.fantasy_price := public.fn_calculate_fantasy_price(
    COALESCE(NEW.overall_rating, NEW.rating, 0),
    COALESCE(NEW.id::text, NEW.ign, NEW.name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_athlete_fantasy_price ON public.athletes;
CREATE TRIGGER trg_set_athlete_fantasy_price
BEFORE INSERT OR UPDATE OF rating, overall_rating, attack, defense, survival, iq, clutch, aggression, game_slug, ign, name
ON public.athletes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_athlete_fantasy_price();

UPDATE public.athletes
SET fantasy_price = public.fn_calculate_fantasy_price(COALESCE(overall_rating, rating, 0), COALESCE(id::text, ign, name, ''))
WHERE COALESCE(fantasy_price_manual_override, false) = false;

CREATE INDEX IF NOT EXISTS fantasy_squads_total_points_idx ON public.fantasy_squads (total_points DESC, updated_at ASC);
CREATE INDEX IF NOT EXISTS fantasy_squads_gameweek_points_idx ON public.fantasy_squads (gameweek_id, gameweek_points DESC, updated_at ASC);

CREATE OR REPLACE VIEW public.fantasy_global_leaderboard AS
SELECT s.*, DENSE_RANK() OVER (ORDER BY s.total_points DESC, s.updated_at ASC) AS rank
FROM public.fantasy_squads s;

CREATE OR REPLACE VIEW public.fantasy_gameweek_leaderboard AS
SELECT s.*, DENSE_RANK() OVER (PARTITION BY s.gameweek_id ORDER BY s.gameweek_points DESC, s.updated_at ASC) AS rank
FROM public.fantasy_squads s;

CREATE TABLE IF NOT EXISTS public.fantasy_league_members (league_id UUID REFERENCES public.fantasy_leagues(id) ON DELETE CASCADE, user_id UUID NOT NULL, joined_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY (league_id, user_id));

CREATE OR REPLACE VIEW public.fantasy_private_league_leaderboard AS
SELECT lm.league_id, s.*, DENSE_RANK() OVER (PARTITION BY lm.league_id ORDER BY s.total_points DESC, s.updated_at ASC) AS rank
FROM public.fantasy_league_members lm
JOIN public.fantasy_squads s ON s.user_id = lm.user_id;
