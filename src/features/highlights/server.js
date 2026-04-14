import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getHighlights({ category } = {}) {
  let query = supabaseAdmin.from('highlights').select('*').order('date', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function createHighlight(body) {
  const { data, error } = await supabaseAdmin.from('highlights').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function deleteHighlight(id) {
  const { error } = await supabaseAdmin.from('highlights').delete().eq('id', id);
  if (error) throw error;
}
