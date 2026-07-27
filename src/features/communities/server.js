import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const TABLE = 'communities';

function clean(payload) {
  return {
    game_slug: payload.game_slug || 'pubg-mobile',
    tier: payload.tier || 'Open',
    name: payload.name || '',
    description: payload.description || null,
    whatsapp_url: payload.whatsapp_url || null,
    discord_url: payload.discord_url || null,
    status: payload.status || 'Published',
    sort_order: Number(payload.sort_order ?? 0) || 0,
  };
}

export async function getCommunities({ game_slug, tier, status } = {}) {
  let query = supabaseAdmin.from(TABLE).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (game_slug) query = query.eq('game_slug', game_slug);
  if (tier) query = query.eq('tier', tier);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCommunity(payload) {
  const { data, error } = await supabaseAdmin.from(TABLE).insert(clean(payload)).select().single();
  if (error) throw error;
  return data;
}

export async function updateCommunity(id, payload) {
  const { data, error } = await supabaseAdmin.from(TABLE).update({ ...clean(payload), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCommunity(id) {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
