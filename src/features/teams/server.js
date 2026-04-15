import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getTeams() {
  const { data: teams, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .order('rank', { ascending: true, nullsLast: true });
  if (error) throw error;

  const { data: athletes, error: athletesError } = await supabaseAdmin.from('athletes').select('*');
  if (athletesError) throw athletesError;

  return teams.map((team) => ({
    ...team,
    players: athletes.filter((athlete) => athlete.team === team.name),
  }));
}

export async function getTeamById(id) {
  const { data: team, error } = await supabaseAdmin.from('teams').select('*').eq('id', id).single();
  if (error) throw error;

  const { data: players, error: playersError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('team', team.name);
  if (playersError) throw playersError;

  return { ...team, players };
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
