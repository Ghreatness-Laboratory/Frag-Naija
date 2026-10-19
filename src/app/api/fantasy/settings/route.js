import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getFantasySquadBudget } from '@/lib/fantasy-pricing';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  transferWindow: { gameSlug: 'pubg-mobile', status: 'closed', transfersRemaining: 0, opens: '', closes: '' },
  chipWindows: {
    triple_captain: { status: 'closed', opens: '', closes: '' },
    manual_substitute: { status: 'closed', opens: '', closes: '' },
  },
};

async function getSetting(key, fallback) {
  const { data, error } = await supabaseAdmin.from('fantasy_settings').select('value').eq('key', key).maybeSingle();
  if (error && error.code !== '42P01') throw error;
  return data?.value ?? fallback;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get('game_slug') || 'pubg-mobile';
  const budgetKey = `${gameSlug.replace(/-/g, '_')}_budget`;
  const defaultBudget = getFantasySquadBudget(gameSlug);

  try {
    const prefix = gameSlug.replace(/-/g, '_');
    const [transferWindow, chipWindows, customBudget, allowRepick, resetAt, rosterLocked] = await Promise.all([
      getSetting(`${prefix}_transfer_window`, DEFAULT_SETTINGS.transferWindow),
      getSetting(`${prefix}_chip_windows`, DEFAULT_SETTINGS.chipWindows),
      getSetting(budgetKey, defaultBudget),
      getSetting(`${prefix}_allow_repick`, true),
      getSetting(`${prefix}_reset_at`, null),
      getSetting(`${prefix}_roster_locked`, false),
    ]);

    const budget = Number(customBudget) || defaultBudget;

    return NextResponse.json({
      game_slug: gameSlug,
      budget,
      max_90_plus_players: gameSlug === 'fc-mobile' ? 2 : null,
      transferWindow,
      chipWindows,
      allow_repick: Boolean(allowRepick),
      reset_at: resetAt || null,
      roster_locked: Boolean(rosterLocked),
    });
  } catch (error) {
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      game_slug: gameSlug,
      budget: defaultBudget,
      max_90_plus_players: gameSlug === 'fc-mobile' ? 2 : null,
      allow_repick: true,
      reset_at: null,
      roster_locked: false,
      warning: error.message || 'Using default fantasy settings.',
    });
  }
}

