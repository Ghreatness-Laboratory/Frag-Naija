import { isFcMobileGame, isFootballGame, isShooterGame, SHOOTER_GAME_SLUGS } from './game-categories';

export { isFcMobileGame, isFootballGame, isShooterGame, SHOOTER_GAME_SLUGS };

export const COMBAT_ATTRIBUTE_COLORS = {
  attack: '#ff7a1a',
  defense: '#00aaff',
  survival: 'rgb(var(--fn-yellow))',
  iq: '#a855f7',
  clutch: 'rgb(var(--fn-green))',
  aggression: '#ef4444',
} as const;

export function clampStat(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback ?? 0);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}

export function normalizeRating(value: unknown, fallback?: unknown) {
  const raw = Number(value ?? fallback ?? 0);
  if (!Number.isFinite(raw)) return 0;
  const scaled = raw > 0 && raw <= 10 ? raw * 10 : raw;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

export function combatAttributes(athlete: Record<string, unknown>, gameSlug?: string | null) {
  const attrs = [
    { key: 'attack', label: 'ATT', name: 'Attack', value: clampStat(athlete.attack), color: COMBAT_ATTRIBUTE_COLORS.attack },
    { key: 'defense', label: 'DEF', name: 'Defense', value: clampStat(athlete.defense), color: COMBAT_ATTRIBUTE_COLORS.defense },
    { key: 'survival', label: 'SUR', name: 'Survival', value: clampStat(athlete.survival), color: COMBAT_ATTRIBUTE_COLORS.survival },
    { key: 'iq', label: 'IQ', name: 'IQ', value: clampStat(athlete.iq), color: COMBAT_ATTRIBUTE_COLORS.iq },
    { key: 'clutch', label: 'CLU', name: 'Clutch', value: clampStat(athlete.clutch), color: COMBAT_ATTRIBUTE_COLORS.clutch },
    { key: 'aggression', label: 'AGR', name: 'Aggression', value: clampStat(athlete.aggression), color: COMBAT_ATTRIBUTE_COLORS.aggression },
  ];

  return isFcMobileGame(gameSlug ?? String(athlete.game_slug ?? ''))
    ? attrs.filter((attr) => ['attack', 'defense', 'iq'].includes(attr.key))
    : attrs;
}
