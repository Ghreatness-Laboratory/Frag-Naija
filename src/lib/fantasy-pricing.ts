import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

export const FANTASY_SQUAD_BUDGET = 10_000_000;
export const FANTASY_PRICE_ROUNDING = 10_000;
export const FANTASY_PRICE_NUDGE = 1_000;

type FantasyPricingAthlete = {
  id?: string | number | null;
  name?: string | null;
  ign?: string | null;
  rating?: number | string | null;
  overall_rating?: number | string | null;
  game_slug?: string | null;
};

const PRICE_TIERS = [
  { minRating: 95, maxRating: 100, minPrice: 1_200_000, maxPrice: 2_000_000 },
  { minRating: 90, maxRating: 94, minPrice: 850_000, maxPrice: 1_200_000 },
  { minRating: 85, maxRating: 89, minPrice: 550_000, maxPrice: 850_000 },
  { minRating: 80, maxRating: 84, minPrice: 450_000, maxPrice: 550_000 },
  { minRating: 70, maxRating: 79, minPrice: 250_000, maxPrice: 450_000 },
  { minRating: 60, maxRating: 69, minPrice: 150_000, maxPrice: 250_000 },
  { minRating: 0, maxRating: 59, minPrice: 80_000, maxPrice: 150_000 },
] as const;

function numericRating(athlete: FantasyPricingAthlete): number {
  const calculated = calculateAthleteOverallRating(athlete as unknown as Record<string, unknown>, athlete.game_slug ?? undefined);
  const raw = Number.isFinite(Number(calculated)) ? Number(calculated) : Number(athlete.overall_rating ?? athlete.rating ?? 0);
  return Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0));
}

function stableKey(athlete: FantasyPricingAthlete): string {
  return String(athlete.id ?? athlete.ign ?? athlete.name ?? '').toLowerCase();
}

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

export function calculateFantasyBasePrice(athlete: FantasyPricingAthlete): number {
  const rating = numericRating(athlete);
  const tier = PRICE_TIERS.find((item) => rating >= item.minRating && rating <= item.maxRating) ?? PRICE_TIERS[PRICE_TIERS.length - 1];
  const span = Math.max(1, tier.maxRating - tier.minRating);
  const progress = Math.min(1, Math.max(0, (rating - tier.minRating) / span));
  return roundToNearest(tier.minPrice + (tier.maxPrice - tier.minPrice) * progress, FANTASY_PRICE_ROUNDING);
}

export function calculateUniqueFantasyPrices<T extends FantasyPricingAthlete>(athletes: T[]): Map<string, number> {
  const used = new Set<number>();
  const prices = new Map<string, number>();
  const rows = athletes
    .filter((athlete) => athlete.id !== null && athlete.id !== undefined)
    .map((athlete) => ({ athlete, basePrice: calculateFantasyBasePrice(athlete), key: stableKey(athlete) }))
    .sort((a, b) => a.basePrice - b.basePrice || a.key.localeCompare(b.key));

  for (const row of rows) {
    let price = row.basePrice;
    while (used.has(price)) price += FANTASY_PRICE_NUDGE;
    used.add(price);
    prices.set(String(row.athlete.id), price);
  }

  return prices;
}
