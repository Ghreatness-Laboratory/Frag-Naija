import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getTransfers({ status } = {}) {
  let query = supabaseAdmin
    .from('transfers')
    .select('*, athletes(id, name, ign)')
    .order('date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function createTransfer(body) {
  const { data, error } = await supabaseAdmin.from('transfers').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function deleteTransfer(id) {
  const { error } = await supabaseAdmin.from('transfers').delete().eq('id', id);
  if (error) throw error;
}
