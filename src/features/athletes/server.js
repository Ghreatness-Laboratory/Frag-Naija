import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getAthletes({ team, status } = {}) {
  let query = supabaseAdmin.from('athletes').select('*').order('rating', { ascending: false });

  if (team) query = query.eq('team', team);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function getAthleteById(id) {
  const { data, error } = await supabaseAdmin.from('athletes').select('*').eq('id', id).single();
  if (error) throw error;

  return data;
}

export async function createAthlete(body) {
  const { data, error } = await supabaseAdmin.from('athletes').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function updateAthlete(id, body) {
  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function deleteAthlete(id) {
  const { error } = await supabaseAdmin.from('athletes').delete().eq('id', id);
  if (error) throw error;
}
