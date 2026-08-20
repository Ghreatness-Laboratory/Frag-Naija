import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const STAKEHOLDER_FIELDS = 'id,name,role,photo_url,twitter_url,instagram_url,linkedin_url,youtube_url,twitch_url,website_url,sort_order,status,created_at,updated_at';

const FIELDS = new Set([
  'name', 'role', 'photo_url', 'twitter_url', 'instagram_url', 'linkedin_url',
  'youtube_url', 'twitch_url', 'website_url', 'sort_order', 'status',
]);

function payload(body = {}) {
  const row = {};
  for (const [key, value] of Object.entries(body)) {
    if (!FIELDS.has(key)) continue;
    if (key === 'sort_order') row[key] = Number(value || 0);
    else row[key] = value === '' ? null : value;
  }
  row.updated_at = new Date().toISOString();
  return row;
}

export async function listStakeholders({ includeDrafts = false, limit } = {}) {
  let query = supabaseAdmin
    .from('stakeholders')
    .select(STAKEHOLDER_FIELDS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (!includeDrafts) query = query.eq('status', 'Published');
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function createStakeholder(body) {
  const { data, error } = await supabaseAdmin.from('stakeholders').insert([payload(body)]).select(STAKEHOLDER_FIELDS).single();
  if (error) throw error;
  return data;
}

export async function updateStakeholder(id, body) {
  const { data, error } = await supabaseAdmin.from('stakeholders').update(payload(body)).eq('id', id).select(STAKEHOLDER_FIELDS).single();
  if (error) throw error;
  return data;
}

export async function deleteStakeholder(id) {
  const { error } = await supabaseAdmin.from('stakeholders').delete().eq('id', id);
  if (error) throw error;
  return { ok: true };
}
