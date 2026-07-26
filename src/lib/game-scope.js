import { GAMES } from '@/lib/games';

export const VALID_GAME_SLUGS = GAMES.map((game) => game.slug);

export function isValidGameSlug(gameSlug) {
  return VALID_GAME_SLUGS.includes(gameSlug);
}

export function requireGameSlug(searchParams) {
  const gameSlug = searchParams.get('game_slug');
  if (!gameSlug) throw new Error('Missing required game_slug query parameter');
  if (!isValidGameSlug(gameSlug)) throw new Error(`Invalid game_slug: ${gameSlug}`);
  return gameSlug;
}

export function assertValidGameSlug(gameSlug) {
  if (!isValidGameSlug(gameSlug)) throw new Error(`Invalid game_slug: ${gameSlug || 'missing'}`);
}
