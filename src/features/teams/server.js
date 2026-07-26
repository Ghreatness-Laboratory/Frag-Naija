import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { assertValidGameSlug } from '@/lib/game-scope';

export async function getTeams({ gameSlug } = {}) {
  assertValidGameSlug(gameSlug);
  const { data: teams, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('game_slug', gameSlug)
    .order('rank', { ascending: true, nullsLast: true });
  if (error) throw error;

  const { data: athletes, error: athletesError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('game_slug', gameSlug);
  if (athletesError) throw athletesError;

  return teams.map((team) => ({
    ...team,
    players: athletes.filter((athlete) => athlete.team === team.name),
  }));
}

export async function getTeamById(id, { gameSlug } = {}) {
  let teamQuery = supabaseAdmin.from('teams').select('*').eq('id', id);
  if (gameSlug) {
    assertValidGameSlug(gameSlug);
    teamQuery = teamQuery.eq('game_slug', gameSlug);
  }
  const { data: team, error } = await teamQuery.single();
  if (error) throw error;

  const { data: players, error: playersError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('team', team.name)
    .eq('game_slug', team.game_slug);
  if (playersError) throw playersError;

  return { ...team, players };
}

export async function createTeam(body) {
  assertValidGameSlug(body.game_slug);
  const { data, error } = await supabaseAdmin.from('teams').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function updateTeam(id, body) {
  if ('game_slug' in body) assertValidGameSlug(body.game_slug);
  const { data, error } = await supabaseAdmin.from('teams').update(body).eq('id', id).select().single();
  if (error) throw error;

  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', id);
  if (error) throw error;
}
