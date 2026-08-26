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
  const { error } = await supabaseAdmin.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}
