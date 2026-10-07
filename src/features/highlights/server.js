import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const HIGHLIGHT_SELECT = 'id,title,category,thumbnail,video_url,date,description,created_at,updated_at';

export async function getHighlights({ category } = {}) {
  let query = supabaseAdmin.from('highlights').select(HIGHLIGHT_SELECT).order('date', { ascending: false });

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
