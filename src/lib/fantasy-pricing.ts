import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

export const FANTASY_SQUAD_BUDGET = 10_000_000;
export const FANTASY_PRICE_ROUNDING = 1_000;
export const FANTASY_PRICE_NUDGE = 1;
export const FANTASY_MAX_PLAYERS_PER_TEAM = 3;
export const FANTASY_TEAM_LIMIT_GAME_SLUGS = ['pubg-mobile', 'codm', 'free-fire'] as const;

type FantasyPricingAthlete = {
  id?: string | number | null;
  name?: string | null;
  ign?: string | null;
  rating?: number | string | null;
  overall_rating?: number | string | null;
  game_slug?: string | null;
};

const PRICE_TIERS = [
  { minRating: 95, maxRating: 100, minPrice: 2_600_000, maxPrice: 3_800_000 },
  { minRating: 90, maxRating: 94, minPrice: 1_600_000, maxPrice: 2_500_000 },
  { minRating: 85, maxRating: 89, minPrice: 1_000_000, maxPrice: 1_550_000 },
  { minRating: 80, maxRating: 84, minPrice: 650_000, maxPrice: 950_000 },
  { minRating: 75, maxRating: 79, minPrice: 500_000, maxPrice: 620_000 },
  { minRating: 70, maxRating: 74, minPrice: 380_000, maxPrice: 680_000 },
  { minRating: 60, maxRating: 69, minPrice: 180_000, maxPrice: 370_000 },
  { minRating: 0, maxRating: 59, minPrice: 70_000, maxPrice: 170_000 },
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
  if (tier.minRating === 95) {
    const anchorRating = 96;
    const anchorPrice = 3_200_000;
    const price = rating <= anchorRating
      ? tier.minPrice + ((anchorPrice - tier.minPrice) * (rating - tier.minRating)) / (anchorRating - tier.minRating)
      : anchorPrice + ((tier.maxPrice - anchorPrice) * (rating - anchorRating)) / (tier.maxRating - anchorRating);
    return roundToNearest(price, FANTASY_PRICE_ROUNDING);
  }
  return roundToNearest(tier.minPrice + (tier.maxPrice - tier.minPrice) * progress, FANTASY_PRICE_ROUNDING);
}

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return hash;
}

function tierForPrice(price: number) {
  return PRICE_TIERS.find((tier) => price >= tier.minPrice && price <= tier.maxPrice) ?? PRICE_TIERS[PRICE_TIERS.length - 1];
}

function boundedUniquePrice(basePrice: number, key: string, used: Set<number>): number {
  const tier = tierForPrice(basePrice);
  const direction = stableHash(key) % 2 === 0 ? 1 : -1;
  const seedOffset = stableHash(key) % Math.max(1, Math.floor(FANTASY_PRICE_ROUNDING / FANTASY_PRICE_NUDGE));
  const candidates = [basePrice + seedOffset * FANTASY_PRICE_NUDGE * direction, basePrice];

  for (const candidate of candidates) {
    if (candidate >= tier.minPrice && candidate <= tier.maxPrice && !used.has(candidate)) return candidate;
  }

  for (let step = FANTASY_PRICE_NUDGE; step <= Math.max(tier.maxPrice - tier.minPrice, FANTASY_PRICE_NUDGE); step += FANTASY_PRICE_NUDGE) {
    const up = basePrice + step;
    if (up <= tier.maxPrice && !used.has(up)) return up;
    const down = basePrice - step;
    if (down >= tier.minPrice && !used.has(down)) return down;
  }

  return basePrice;
}

export function fantasyTeamLimitApplies(gameSlug?: string | null): boolean {
  return FANTASY_TEAM_LIMIT_GAME_SLUGS.includes(String(gameSlug ?? '').toLowerCase() as typeof FANTASY_TEAM_LIMIT_GAME_SLUGS[number]);
}

export function fantasyTeamLimitViolation<T extends { team?: string | null; game_slug?: string | null }>(athletes: T[], candidate?: T | null): string {
  const roster = candidate ? [...athletes, candidate] : athletes;
  const teamCounts = new Map<string, number>();

  for (const athlete of roster) {
    if (!fantasyTeamLimitApplies(athlete.game_slug) || !athlete.team) continue;
    const count = (teamCounts.get(athlete.team) ?? 0) + 1;
    if (count > FANTASY_MAX_PLAYERS_PER_TEAM) return `Maximum ${FANTASY_MAX_PLAYERS_PER_TEAM} players per team reached — remove another ${athlete.team} player first`;
    teamCounts.set(athlete.team, count);
  }

  return '';
}

export function calculateUniqueFantasyPrices<T extends FantasyPricingAthlete>(athletes: T[]): Map<string, number> {
  const used = new Set<number>();
  const prices = new Map<string, number>();
  const rows = athletes
    .filter((athlete) => athlete.id !== null && athlete.id !== undefined)
    .map((athlete) => ({ athlete, basePrice: calculateFantasyBasePrice(athlete), key: stableKey(athlete) }))
    .sort((a, b) => a.basePrice - b.basePrice || a.key.localeCompare(b.key));

  for (const row of rows) {
    const price = boundedUniquePrice(row.basePrice, row.key, used);
    used.add(price);
    prices.set(String(row.athlete.id), price);
  }

  return prices;
}
