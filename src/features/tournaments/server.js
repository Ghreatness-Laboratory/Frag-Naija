import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const TOURNAMENT_SELECT = `
  id,name,start_date,end_date,status,game,game_slug,prize_pool,currency,description,format,region,image_url,tier,
  rules_overview,participant_count,slot_count,registration_instructions,watch_url,access_instructions,metadata,created_at,updated_at,
  tournament_results(id,placement,points_earned,created_at,team:teams(id,name,logo_url))
`;

export async function getTournaments({ status, game_slug } = {}) {
  let query = supabaseAdmin
    .from('tournaments')
    .select(TOURNAMENT_SELECT)
    .order('start_date', { ascending: false });
  if (status) query = query.eq('status', status);
  if (game_slug) query = query.eq('game_slug', game_slug);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTournamentById(id) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .select(TOURNAMENT_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTournament(body) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .insert([body])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTournament(id, body) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTournamentStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTournament(id) {
  // Results and fixtures are historical records. Do this check before the
  // database-level cascades so an admin cannot delete that history by mistake.
  const [results, matches] = await Promise.all([
    supabaseAdmin.from('tournament_results').select('*', { count: 'exact', head: true }).eq('tournament_id', id),
    supabaseAdmin.from('tournament_matches').select('*', { count: 'exact', head: true }).eq('tournament_id', id),
  ]);

  if (results.error) throw results.error;
  if (matches.error) throw matches.error;

  const resultCount = results.count || 0;
  const matchCount = matches.count || 0;
  if (resultCount || matchCount) {
    const records = [
      resultCount && `${resultCount} recorded result${resultCount === 1 ? '' : 's'}`,
      matchCount && `${matchCount} tournament match${matchCount === 1 ? '' : 'es'}`,
    ].filter(Boolean).join(' and ');
    const error = new Error(`Cannot delete this tournament because it has ${records}. Remove those records first.`);
    error.status = 409;
    throw error;
  }

  const { error } = await supabaseAdmin.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}
