import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

async function getRankingTotals(teamIds) {
  if (!teamIds.length) return new Map();

  const { data, error } = await supabaseAdmin
    .from('tournament_results')
    .select('team_id, points_earned')
    .in('team_id', teamIds);

  if (error) return new Map();

  return (data ?? []).reduce((totals, row) => {
    const current = totals.get(row.team_id) ?? 0;
    totals.set(row.team_id, current + Number(row.points_earned ?? 0));
    return totals;
  }, new Map());
}

function withPowerRanks(teams, totals) {
  return teams
    .map((team) => ({ ...team, total_ranking_points: totals.get(team.id) ?? 0 }))
    .sort((a, b) => {
      if (b.total_ranking_points !== a.total_ranking_points) return b.total_ranking_points - a.total_ranking_points;
      if ((a.rank ?? null) != null && (b.rank ?? null) != null) return a.rank - b.rank;
      if ((a.rank ?? null) != null) return -1;
      if ((b.rank ?? null) != null) return 1;
      return (b.wins ?? 0) - (a.wins ?? 0);
    })
    .map((team, index) => ({ ...team, power_rank: index + 1 }));
}

export async function getTeams({ game_slug } = {}) {
  let query = supabaseAdmin
    .from('teams')
    .select('*, organization:organizations(id,name,logo_url)')
    .order('rank', { ascending: true, nullsLast: true });

  if (game_slug) query = query.eq('game_slug', game_slug);

  const { data: teams, error } = await query;
  if (error) throw error;

  let athleteQuery = supabaseAdmin.from('athletes').select('*');
  if (game_slug) athleteQuery = athleteQuery.eq('game_slug', game_slug);
  const { data: athletes, error: athletesError } = await athleteQuery;
  if (athletesError) throw athletesError;

  const totals = await getRankingTotals(teams.map((team) => team.id));

  return withPowerRanks(teams.map((team) => ({
    ...team,
    players: athletes.filter((athlete) => athlete.team === team.name),
  })), totals);
}

export async function getTeamById(id) {
  const { data: team, error } = await supabaseAdmin.from('teams').select('*, organization:organizations(id,name,logo_url)').eq('id', id).single();
  if (error) throw error;

  const { data: players, error: playersError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('team', team.name);
  if (playersError) throw playersError;

  const totals = await getRankingTotals([team.id]);

  return { ...team, total_ranking_points: totals.get(team.id) ?? 0, players };
}

export async function createTeam(body) {
  const { data, error } = await supabaseAdmin.from('teams').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function updateTeam(id, body) {
  const { data, error } = await supabaseAdmin.from('teams').update(body).eq('id', id).select().single();
  if (error) throw error;

  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', id);
  if (error) throw error;
}
