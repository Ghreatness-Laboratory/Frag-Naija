export const SHOOTER_GAME_SLUGS = new Set(['pubg-mobile', 'free-fire', 'cod-mobile', 'blood-strike']);
export const FOOTBALL_GAME_SLUGS = new Set(['efootball', 'fc-mobile', 'ea-fc-26']);

export function isShooterGame(gameSlug?: string | null) {
  return SHOOTER_GAME_SLUGS.has(String(gameSlug ?? '').toLowerCase());
}

export function isFootballGame(gameSlug?: string | null) {
  return FOOTBALL_GAME_SLUGS.has(String(gameSlug ?? '').toLowerCase());
}

export function isFcMobileGame(gameSlug?: string | null) {
  return String(gameSlug ?? '').toLowerCase() === 'fc-mobile';
}
