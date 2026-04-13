import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getTournaments({ status } = {}) {
  let query = supabaseAdmin
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function getTournamentById(id) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .select('*')
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
