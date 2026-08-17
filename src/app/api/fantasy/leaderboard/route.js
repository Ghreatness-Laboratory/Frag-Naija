import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const VIEW_BY_SCOPE = {
  global: 'fantasy_global_leaderboard',
  gameweek: 'fantasy_gameweek_leaderboard',
  private: 'fantasy_private_league_leaderboard',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || 'global';
  const view = VIEW_BY_SCOPE[scope] || VIEW_BY_SCOPE.global;
  let query = supabaseAdmin.from(view).select('*').order('rank', { ascending: true }).limit(100);

  if (scope === 'gameweek' && searchParams.get('gameweek_id')) query = query.eq('gameweek_id', searchParams.get('gameweek_id'));
  if (scope === 'private' && searchParams.get('league_id')) query = query.eq('league_id', searchParams.get('league_id'));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data || [] });
}
