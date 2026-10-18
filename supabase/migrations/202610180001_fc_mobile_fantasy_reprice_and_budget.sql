-- ==============================================================================
-- FC Mobile Fantasy League: Dedicated 5,000,000 Budget & Reprice Rules
-- Only applies to game_slug = 'fc-mobile'. All other games remain untouched.
-- ==============================================================================

-- 1. Create backup table for athlete fantasy prices before applying reprice
CREATE TABLE IF NOT EXISTS public.athletes_fantasy_price_backup (
  id UUID NOT NULL,
  game_slug TEXT,
  name TEXT,
  overall_rating NUMERIC(5,2),
  fantasy_price NUMERIC(14,2),
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id, backed_up_at)
);

-- Back up current FC Mobile athlete prices
INSERT INTO public.athletes_fantasy_price_backup (id, game_slug, name, overall_rating, fantasy_price)
SELECT id, game_slug, name, overall_rating, fantasy_price
FROM public.athletes
WHERE game_slug = 'fc-mobile';

-- 2. Configure FC Mobile squad budget to 5,000,000 in fantasy_settings
INSERT INTO public.fantasy_settings (key, value, updated_at)
VALUES (
  'fc_mobile_budget',
  '5000000'::jsonb,
  timezone('utc'::text, now())
)
ON CONFLICT (key) DO UPDATE
SET value = '5000000'::jsonb,
    updated_at = timezone('utc'::text, now());

-- 3. Reprice FC Mobile athletes so that:
--    - 3*P90 + 3*P_min > 5,000,000 (No squad can hold 3 players with rating >= 90)
--    - 2*P90_max + 4*P_min <= 5,000,000 (Squad with 2 top stars is buildable)
--    - Clear price gap below 90 (rating 89 max is 1,150,000 vs rating 90 floor at 1,650,000)

UPDATE public.athletes
SET fantasy_price = CASE
  -- 95-100 rating
  WHEN COALESCE(overall_rating, rating, 0) >= 95 THEN 2150000 + ROUND(((COALESCE(overall_rating, rating, 0) - 95) / 5.0) * 200000)
  -- 90-94 rating (P90 = 1,650,000 to P90_max = 2,100,000)
  WHEN COALESCE(overall_rating, rating, 0) >= 90 THEN 1650000 + ROUND(((COALESCE(overall_rating, rating, 0) - 90) / 4.0) * 450000)
  -- 85-89 rating (Clear gap: max is 1,150,000, which is 500,000 below 1,650,000)
  WHEN COALESCE(overall_rating, rating, 0) >= 85 THEN 820000 + ROUND(((COALESCE(overall_rating, rating, 0) - 85) / 4.0) * 330000)
  -- 80-84 rating
  WHEN COALESCE(overall_rating, rating, 0) >= 80 THEN 480000 + ROUND(((COALESCE(overall_rating, rating, 0) - 80) / 4.0) * 220000)
  -- 75-79 rating
  WHEN COALESCE(overall_rating, rating, 0) >= 75 THEN 300000 + ROUND(((COALESCE(overall_rating, rating, 0) - 75) / 4.0) * 150000)
  -- 70-74 rating
  WHEN COALESCE(overall_rating, rating, 0) >= 70 THEN 180000 + ROUND(((COALESCE(overall_rating, rating, 0) - 70) / 4.0) * 100000)
  -- 60-69 rating
  WHEN COALESCE(overall_rating, rating, 0) >= 60 THEN 100000 + ROUND(((COALESCE(overall_rating, rating, 0) - 60) / 9.0) * 60000)
  -- 0-59 rating (P_min = 70,000)
  ELSE 70000 + ROUND((LEAST(59, GREATEST(0, COALESCE(overall_rating, rating, 0))) / 59.0) * 25000)
END
WHERE game_slug = 'fc-mobile';

-- 4. Set explicit known player prices if matched by name
UPDATE public.athletes SET fantasy_price = 2100000 WHERE game_slug = 'fc-mobile' AND name ILIKE '%Osimhen%';
UPDATE public.athletes SET fantasy_price = 1760000 WHERE game_slug = 'fc-mobile' AND name ILIKE '%Lookman%';
UPDATE public.athletes SET fantasy_price = 1650000 WHERE game_slug = 'fc-mobile' AND name ILIKE '%Iwobi%';
UPDATE public.athletes SET fantasy_price = 1060000 WHERE game_slug = 'fc-mobile' AND name ILIKE '%Chukwueze%';
UPDATE public.athletes SET fantasy_price = 900000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Boniface%';
UPDATE public.athletes SET fantasy_price = 660000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Ndidi%';
UPDATE public.athletes SET fantasy_price = 520000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Bassey%';
UPDATE public.athletes SET fantasy_price = 400000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Simon%';
UPDATE public.athletes SET fantasy_price = 330000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Iheanacho%';
UPDATE public.athletes SET fantasy_price = 240000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Aina%';
UPDATE public.athletes SET fantasy_price = 140000  WHERE game_slug = 'fc-mobile' AND name ILIKE '%Nwabali%';
UPDATE public.athletes SET fantasy_price = 70000   WHERE game_slug = 'fc-mobile' AND name ILIKE '%Onyedika%';
