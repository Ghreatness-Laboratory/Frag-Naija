import { isFootballGame } from './game-categories';

export type AthleteStatKey = 'attack' | 'defense' | 'survival' | 'iq' | 'clutch' | 'aggression';

export const ATHLETE_STAT_CATEGORIES: Record<string, AthleteStatKey[]> = {
  'football': ['attack', 'defense', 'iq'],
  default: ['attack', 'defense', 'survival', 'iq', 'clutch', 'aggression'],
};

export function getAthleteStatCategories(gameSlug?: string | null): AthleteStatKey[] {
  return isFootballGame(gameSlug)
    ? ATHLETE_STAT_CATEGORIES['football']
    : ATHLETE_STAT_CATEGORIES.default;
}

export function normalizeStatValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function calculateAthleteOverallRating(athlete: Record<string, unknown>, gameSlug?: string | null): number | null {
  const stats = getAthleteStatCategories(gameSlug ?? String(athlete.game_slug ?? ''))
    .map((key) => normalizeStatValue(athlete[key]))
    .filter((value): value is number => value !== null);

  if (!stats.length) return null;
  return Math.round(stats.reduce((sum, value) => sum + value, 0) / stats.length);
}
