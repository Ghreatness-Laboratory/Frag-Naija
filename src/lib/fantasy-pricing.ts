import { calculateAthleteOverallRating } from '@/lib/athlete-rating';
import { isChessGame, isFootballGame } from '@/lib/game-categories';

export const FANTASY_SQUAD_BUDGET = 10_000_000;
export const FANTASY_PRICE_ROUNDING = 1_000;
export const FANTASY_PRICE_NUDGE = 1;
export const FANTASY_MAX_PLAYERS_PER_TEAM = 1;
export const FC_MOBILE_FANTASY_BUDGET = 6_000_000;
export const FC_MOBILE_MAX_NINETY_PLUS = 2;

export const GAME_FANTASY_BUDGETS: Record<string, number> = {
  'fc-mobile': FC_MOBILE_FANTASY_BUDGET,
  'free-fire': FANTASY_SQUAD_BUDGET,
  default: FANTASY_SQUAD_BUDGET,
};

export function getFantasySquadBudget(gameSlug?: string | null): number {
  if (gameSlug === 'fc-mobile') return GAME_FANTASY_BUDGETS['fc-mobile'];
  if (gameSlug === 'free-fire') return GAME_FANTASY_BUDGETS['free-fire'];
  return GAME_FANTASY_BUDGETS.default;
}

type FantasyPricingAthlete = {
  id?: string | number | null;
  name?: string | null;
  ign?: string | null;
  rating?: number | string | null;
  overall_rating?: number | string | null;
  game_slug?: string | null;
  attack?: number | string | null;
  defense?: number | string | null;
  iq?: number | string | null;
  clutch?: number | string | null;
  survival?: number | string | null;
  aggression?: number | string | null;
};

// Default pricing tiers (PUBG Mobile, Free Fire, etc.)
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

// Dedicated FC Mobile pricing tiers:
// Satisfies with B = 6,000,000, N = 6, P_min = 70,000:
// 1) 3*P90 + 3*P_min > B => 3*1,950,000 + 3*70,000 = 6,060,000 > 6,000,000 (cannot hold three 90+ players)
// 2) 2*P90_max + 4*P_min <= B => 2*2,450,000 + 4*70,000 = 5,180,000 <= 6,000,000 (two top stars buildable)
// 3) Strict monotonicity with clear gap below 90: rating 89 max is 1,150,000 (800k gap below 90 at 1,950,000)
export const FC_MOBILE_PRICE_TIERS = [
  { minRating: 95, maxRating: 100, minPrice: 2_500_000, maxPrice: 2_800_000 },
  { minRating: 90, maxRating: 94, minPrice: 1_950_000, maxPrice: 2_450_000 },
  { minRating: 85, maxRating: 89, minPrice: 820_000, maxPrice: 1_150_000 },
  { minRating: 80, maxRating: 84, minPrice: 480_000, maxPrice: 700_000 },
  { minRating: 75, maxRating: 79, minPrice: 300_000, maxPrice: 450_000 },
  { minRating: 70, maxRating: 74, minPrice: 180_000, maxPrice: 280_000 },
  { minRating: 60, maxRating: 69, minPrice: 100_000, maxPrice: 160_000 },
  { minRating: 0, maxRating: 59, minPrice: 70_000, maxPrice: 95_000 },
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

export function getEffectiveAthleteRating(athlete: FantasyPricingAthlete): number {
  return numericRating(athlete);
}

export function isNinetyPlusAthlete(athlete: FantasyPricingAthlete): boolean {
  return getEffectiveAthleteRating(athlete) >= 90;
}

export function fcMobileNinetyPlusViolation<T extends FantasyPricingAthlete>(athletes: T[], candidate?: T | null): string {
  const isCandidateEligible = candidate ? isNinetyPlusAthlete(candidate) : false;
  const currentCount = athletes.filter((a) => (a.game_slug === 'fc-mobile' || !a.game_slug) && isNinetyPlusAthlete(a)).length;
  const projectedCount = currentCount + (isCandidateEligible ? 1 : 0);

  if (projectedCount > FC_MOBILE_MAX_NINETY_PLUS) {
    return 'FC Mobile squad limit: Maximum 2 players rated 90 or higher allowed.';
  }
  return '';
}

export function calculateFantasyBasePrice(athlete: FantasyPricingAthlete): number {
  const rating = numericRating(athlete);
  const isFcMobile = athlete.game_slug === 'fc-mobile';
  const tiers = isFcMobile ? FC_MOBILE_PRICE_TIERS : PRICE_TIERS;
  const tier = tiers.find((item) => rating >= item.minRating && rating <= item.maxRating) ?? tiers[tiers.length - 1];
  const span = Math.max(1, tier.maxRating - tier.minRating);
  const progress = Math.min(1, Math.max(0, (rating - tier.minRating) / span));

  if (!isFcMobile && tier.minRating === 95) {
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

function tierForPrice(price: number, gameSlug?: string | null) {
  const tiers = gameSlug === 'fc-mobile' ? FC_MOBILE_PRICE_TIERS : PRICE_TIERS;
  return tiers.find((tier) => price >= tier.minPrice && price <= tier.maxPrice) ?? tiers[tiers.length - 1];
}

function boundedUniquePrice(basePrice: number, key: string, used: Set<number>, gameSlug?: string | null): number {
  const tier = tierForPrice(basePrice, gameSlug);
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
  return !isChessGame(gameSlug) && !isFootballGame(gameSlug);
}

export function fantasyTeamLimitViolation<T extends { team?: string | null; game_slug?: string | null }>(athletes: T[], candidate?: T | null): string {
  const roster = candidate ? [...athletes, candidate] : athletes;
  const teamCounts = new Map<string, number>();

  for (const athlete of roster) {
    const team = String(athlete.team || '').trim();
    if (!fantasyTeamLimitApplies(athlete.game_slug) || !team) continue;
    const count = (teamCounts.get(team) ?? 0) + 1;
    if (count > FANTASY_MAX_PLAYERS_PER_TEAM) return `Only ${FANTASY_MAX_PLAYERS_PER_TEAM} player per team allowed — you already have a player from ${team} in your squad.`;
    teamCounts.set(team, count);
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
    const price = boundedUniquePrice(row.basePrice, row.key, used, row.athlete.game_slug);
    used.add(price);
    prices.set(String(row.athlete.id), price);
  }

  return prices;
}
