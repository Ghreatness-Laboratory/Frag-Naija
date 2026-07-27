import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getShopItems({ status, game_slug } = {}) {
  let query = supabaseAdmin
    .from('shop_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (game_slug) query = query.eq('game_slug', game_slug);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
