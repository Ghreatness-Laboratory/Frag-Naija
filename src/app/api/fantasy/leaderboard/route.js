import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

function userDisplayName(user) {
  return user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown Manager';
}

export async function GET(request) {
  const gameSlug = new URL(request.url).searchParams.get('game_slug') || 'pubg-mobile';
  try {
    const { data: squads, error } = await supabaseAdmin
      .from('fantasy_squads')
      .select('id, user_id, total_points, gameweek_points, squad_value, updated_at')
      .eq('game_slug', gameSlug)
      .order('total_points', { ascending: false })
      .order('gameweek_points', { ascending: false })
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) throw error;

    const userIds = [...new Set((squads || []).map((squad) => squad.user_id).filter(Boolean))];
    const usersById = new Map();

    for (const userId of userIds) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (data?.user) usersById.set(userId, data.user);
    }

    const rows = (squads || []).map((squad, index) => ({
      rank: index + 1,
      username: userDisplayName(usersById.get(squad.user_id)),
      total_points: Number(squad.total_points || 0),
      gameweek_points: Number(squad.gameweek_points || 0),
      squad_value: Number(squad.squad_value || 0),
    }));

    return NextResponse.json({
      visibility: 'public_full',
      rows,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to load fantasy leaderboard.' }, { status: 500 });
  }
}
