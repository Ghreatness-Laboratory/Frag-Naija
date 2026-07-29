import { isFcMobileGame, isFootballGame, isShooterGame, SHOOTER_GAME_SLUGS } from './game-categories';

export { isFcMobileGame, isFootballGame, isShooterGame, SHOOTER_GAME_SLUGS };


export const ATHLETE_STATUSES = ['Active', 'Inactive', 'Banned', 'Free Agent', 'Suspended', 'Dead'] as const;

export type AthleteStatus = (typeof ATHLETE_STATUSES)[number];

export function normalizeAthleteStatus(value: unknown): AthleteStatus {
  const status = String(value ?? 'Active').trim();
  return (ATHLETE_STATUSES as readonly string[]).includes(status) ? status as AthleteStatus : 'Active';
}

export function athleteStatusTone(statusValue: unknown, primary = 'rgb(var(--fn-green))') {
  const status = normalizeAthleteStatus(statusValue);
  const tones: Record<AthleteStatus, { background: string; color: string; borderColor: string; dotColor: string }> = {
    Active: { background: `${primary}20`, color: primary, borderColor: `${primary}55`, dotColor: primary },
    Inactive: { background: 'rgb(var(--fn-card2) / 0.75)', color: 'rgb(var(--fn-muted))', borderColor: 'rgb(var(--fn-gborder))', dotColor: 'rgb(var(--fn-muted))' },
    'Free Agent': { background: 'rgba(59, 130, 246, 0.14)', color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.45)', dotColor: '#60a5fa' },
    Suspended: { background: 'rgba(245, 197, 66, 0.14)', color: '#f5c542', borderColor: 'rgba(245, 197, 66, 0.45)', dotColor: '#f5c542' },
    Banned: { background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#ef4444' },
    Dead: { background: 'rgba(8, 12, 10, 0.82)', color: 'rgba(148, 163, 184, 0.78)', borderColor: 'rgba(71, 85, 105, 0.42)', dotColor: 'rgba(100, 116, 139, 0.72)' },
  };
  return tones[status];
}

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
    { key: 'clutch', label: 'CLT', name: 'Clutch', value: clampStat(athlete.clutch), color: COMBAT_ATTRIBUTE_COLORS.clutch },
    { key: 'iq', label: 'IQ', name: 'IQ', value: clampStat(athlete.iq), color: COMBAT_ATTRIBUTE_COLORS.iq },
  ];

  return isFootballGame(gameSlug ?? String(athlete.game_slug ?? ''))
    ? attrs.filter((attr) => ['attack', 'defense', 'iq'].includes(attr.key))
    : attrs;
}
