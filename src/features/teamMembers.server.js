import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const FIELDS = new Set([
  'name', 'role', 'bio', 'photo_url', 'currently_playing_game_slug',
  'twitter_url', 'instagram_url', 'linkedin_url', 'twitch_url', 'youtube_url',
  'sort_order', 'status',
]);

function payload(body = {}) {
  const row = {};
  for (const [key, value] of Object.entries(body)) {
    if (FIELDS.has(key)) row[key] = value === '' ? null : value;
  }
  row.sort_order = Number(row.sort_order ?? 0) || 0;
  row.status = row.status || 'Published';
  row.updated_at = new Date().toISOString();
  return row;
}

export async function getTeamMembers({ status } = {}) {
  let query = supabaseAdmin.from('team_members').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTeamMember(body) {
  const { data, error } = await supabaseAdmin.from('team_members').insert([payload(body)]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeamMember(id, body) {
  const { data, error } = await supabaseAdmin.from('team_members').update(payload(body)).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTeamMember(id) {
  const { error } = await supabaseAdmin.from('team_members').delete().eq('id', id);
  if (error) throw error;
}
