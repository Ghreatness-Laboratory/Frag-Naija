export const FANTASY_SQUAD_BUDGET_NAIRA = 10_000_000;
export const FANTASY_SQUAD_SIZE = 6;
export const FANTASY_STARTER_COUNT = 4;
export const FANTASY_BENCH_COUNT = 2;
export const FANTASY_MAX_PLAYERS_PER_TEAM = 3;

export const FANTASY_TEAM_LIMIT_GAME_SLUGS = new Set([
  'pubg-mobile',
  'cod-mobile',
  'blood-strike',
  'free-fire',
]);

type PriceBand = {
  minRating: number;
  maxRating: number;
  minPrice: number;
  maxPrice: number;
};

export type FantasyAthletePricingInput = {
  id: string;
  name?: string | null;
  ign?: string | null;
  team?: string | null;
  rating?: number | null;
  overall_rating?: number | null;
};

export type FantasyPricedAthlete<T extends FantasyAthletePricingInput> = T & {
  fantasy_price: number;
};

export const FANTASY_PRICE_BANDS: PriceBand[] = [
  { minRating: 95, maxRating: 100, minPrice: 2_600_000, maxPrice: 3_800_000 },
  { minRating: 90, maxRating: 94,  minPrice: 1_600_000, maxPrice: 2_500_000 },
  { minRating: 85, maxRating: 89,  minPrice: 1_000_000, maxPrice: 1_550_000 },
  { minRating: 80, maxRating: 84,  minPrice: 650_000,   maxPrice: 950_000 },
  { minRating: 75, maxRating: 79,  minPrice: 500_000,   maxPrice: 620_000 },
  { minRating: 70, maxRating: 74,  minPrice: 380_000,   maxPrice: 520_000 },
  { minRating: 60, maxRating: 69,  minPrice: 180_000,   maxPrice: 370_000 },
  { minRating: 0,  maxRating: 59,  minPrice: 70_000,    maxPrice: 170_000 },
];

export function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

export function getFantasyRating(athlete: FantasyAthletePricingInput) {
  const rating = Number(athlete.overall_rating ?? athlete.rating ?? 0);
  return Number.isFinite(rating) ? Math.max(0, Math.min(100, rating)) : 0;
}

function bandForRating(rating: number) {
  return FANTASY_PRICE_BANDS.find((band) => rating >= band.minRating && rating <= band.maxRating) ?? FANTASY_PRICE_BANDS[FANTASY_PRICE_BANDS.length - 1];
}

function interpolate(minRating: number, maxRating: number, minPrice: number, maxPrice: number, rating: number) {
  if (maxRating === minRating) return minPrice;
  const ratio = (rating - minRating) / (maxRating - minRating);
  return minPrice + ratio * (maxPrice - minPrice);
}

export function baseFantasyPriceForRating(inputRating: number) {
  const rating = Math.max(0, Math.min(100, inputRating));

  if (rating >= 95) {
    if (rating <= 96) return interpolate(95, 96, 2_600_000, 3_200_000, rating);
    return interpolate(96, 100, 3_200_000, 3_800_000, rating);
  }

  if (rating >= 70 && rating <= 74) {
    if (rating <= 72) return interpolate(70, 72, 380_000, 500_000, rating);
    return interpolate(72, 74, 500_000, 520_000, rating);
  }

  const band = bandForRating(rating);
  return interpolate(band.minRating, band.maxRating, band.minPrice, band.maxPrice, rating);
}

function stableHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clampedPriceForAthlete(athlete: FantasyAthletePricingInput) {
  const rating = getFantasyRating(athlete);
  const band = bandForRating(rating);
  const base = Math.round(baseFantasyPriceForRating(rating));
  const offset = stableHash(`${athlete.id}:${athlete.ign ?? athlete.name ?? ''}`) % 997;
  return Math.max(band.minPrice, Math.min(band.maxPrice, base + offset));
}

export function priceFantasyAthletes<T extends FantasyAthletePricingInput>(athletes: T[]): FantasyPricedAthlete<T>[] {
  const used = new Set<number>();

  return athletes.map((athlete) => {
    const rating = getFantasyRating(athlete);
    const band = bandForRating(rating);
    let price = clampedPriceForAthlete(athlete);

    while (used.has(price) && price < band.maxPrice) price += 1;
    while (used.has(price) && price > band.minPrice) price -= 1;

    if (used.has(price)) {
      for (let candidate = band.minPrice; candidate <= band.maxPrice; candidate += 1) {
        if (!used.has(candidate)) {
          price = candidate;
          break;
        }
      }
    }

    used.add(price);
    return { ...athlete, fantasy_price: price };
  });
}

export function hasDuplicateFantasyPrices(athletes: Array<{ fantasy_price: number }>) {
  return new Set(athletes.map((athlete) => athlete.fantasy_price)).size !== athletes.length;
}

export function appliesTeamLimit(gameSlug: string) {
  return FANTASY_TEAM_LIMIT_GAME_SLUGS.has(gameSlug);
}

export function countTeamMembers(athletes: FantasyAthletePricingInput[]) {
  return athletes.reduce<Record<string, number>>((acc, athlete) => {
    const team = athlete.team?.trim();
    if (!team) return acc;
    acc[team] = (acc[team] ?? 0) + 1;
    return acc;
  }, {});
}
