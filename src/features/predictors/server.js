import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getPredictors() {
  const { data, error } = await supabaseAdmin
    .from('predictors')
    .select('*')
    .order('rank', { ascending: true });
  if (error) throw error;

  return data || [];
}

export async function getPredictorById(id) {
  const { data, error } = await supabaseAdmin
    .from('predictors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  return data;
}

export async function upsertPredictor(body) {
  const { id, rank, tag, accuracy, weekly_earnings } = body;

  const record = { rank, tag, accuracy, weekly_earnings };
  if (id !== undefined) record.id = id;

  const { data, error } = await supabaseAdmin
    .from('predictors')
    .upsert([record], { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function deletePredictor(id) {
  const { error } = await supabaseAdmin.from('predictors').delete().eq('id', id);
  if (error) throw error;
}
