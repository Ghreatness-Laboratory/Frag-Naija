export function roundDuelOdds(value: number) {
  return Math.round(value * 100) / 100;
}

export function kdOf(athlete?: { kills?: number | string | null; kd?: number | string | null; k_d?: number | string | null; overall_rating?: number | string | null; rating?: number | string | null } | null) {
  const explicit = Number(athlete?.kd ?? athlete?.k_d ?? athlete?.kills);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const ratingFallback = Number(athlete?.overall_rating ?? athlete?.rating ?? 50);
  return Math.max(0.1, roundDuelOdds(ratingFallback / 25));
}

export function calculateDuelOddsFromKd(kdA: number, kdB: number) {
  const safeA = Math.max(0.1, Number(kdA) || 0.1);
  const safeB = Math.max(0.1, Number(kdB) || 0.1);
  const total = safeA + safeB;

  return {
    odds_a: roundDuelOdds(total / safeA),
    odds_b: roundDuelOdds(total / safeB),
  };
}
