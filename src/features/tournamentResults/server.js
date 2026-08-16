import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const SELECT = '*, tournament:tournaments(id,name,game_slug,tier,prize_pool,currency), team:teams!tournament_results_team_id_fkey(id,name,game_slug,logo_url)';

export async function getTournamentResults({ game_slug } = {}) {
  const { data, error } = await supabaseAdmin
    .from('tournament_results')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  return game_slug ? rows.filter((row) => row.team?.game_slug === game_slug) : rows;
}

export async function createTournamentResult(body) {
  const { data, error } = await supabaseAdmin.from('tournament_results').insert([body]).select(SELECT).single();
  if (error) throw error;
  return data;
}

export async function updateTournamentResult(id, body) {
  const { data, error } = await supabaseAdmin.from('tournament_results').update(body).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return data;
}

export async function deleteTournamentResult(id) {
  const { error } = await supabaseAdmin.from('tournament_results').delete().eq('id', id);
  if (error) throw error;
}
