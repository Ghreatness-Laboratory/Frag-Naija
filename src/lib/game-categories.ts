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


export const GAME_METRIC_THRESHOLDS = {
  shooter: { operator: '>', value: 5, label: 'over 5' },
  football: { operator: '>', value: 3, label: 'over 3' },
  default: { operator: '>', value: 5, label: 'over 5' },
} as const;

export function getMetricThreshold(gameSlug?: string | null) {
  if (isFootballGame(gameSlug)) return GAME_METRIC_THRESHOLDS.football;
  if (isShooterGame(gameSlug)) return GAME_METRIC_THRESHOLDS.shooter;
  return GAME_METRIC_THRESHOLDS.default;
}
