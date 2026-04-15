import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getFeatured({ activeOnly } = {}) {
  let query = supabaseAdmin
    .from('featured')
    .select('*')
    .order('priority', { ascending: true });

  if (activeOnly === true) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function getFeaturedById(id) {
  const { data, error } = await supabaseAdmin
    .from('featured')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  return data;
}

export async function createFeatured(body) {
  const { type, ref_id, label, badge, priority, is_active } = body;

  const { data, error } = await supabaseAdmin
    .from('featured')
    .insert([{ type, ref_id, label, badge, priority, is_active: is_active ?? true }])
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function updateFeatured(id, body) {
  const { type, ref_id, label, badge, priority, is_active } = body;

  const updates = {};
  if (type !== undefined)      updates.type      = type;
  if (ref_id !== undefined)    updates.ref_id    = ref_id;
  if (label !== undefined)     updates.label     = label;
  if (badge !== undefined)     updates.badge     = badge;
  if (priority !== undefined)  updates.priority  = priority;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin
    .from('featured')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function deleteFeatured(id) {
  const { error } = await supabaseAdmin.from('featured').delete().eq('id', id);
  if (error) throw error;
}
