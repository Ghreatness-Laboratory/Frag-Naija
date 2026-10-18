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
    const [transferWindow, chipWindows, customBudget] = await Promise.all([
      getSetting(`${gameSlug.replace(/-/g, '_')}_transfer_window`, DEFAULT_SETTINGS.transferWindow),
      getSetting(`${gameSlug.replace(/-/g, '_')}_chip_windows`, DEFAULT_SETTINGS.chipWindows),
      getSetting(budgetKey, defaultBudget),
    ]);

    const budget = Number(customBudget) || defaultBudget;

    return NextResponse.json({
      game_slug: gameSlug,
      budget,
      max_90_plus_players: gameSlug === 'fc-mobile' ? 2 : null,
      transferWindow,
      chipWindows,
    });
  } catch (error) {
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      game_slug: gameSlug,
      budget: defaultBudget,
      max_90_plus_players: gameSlug === 'fc-mobile' ? 2 : null,
      warning: error.message || 'Using default fantasy settings.',
    });
  }
}

