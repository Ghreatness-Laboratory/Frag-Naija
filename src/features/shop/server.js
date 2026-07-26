import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { assertValidGameSlug } from '@/lib/game-scope';

export async function getShopItems({ status, gameSlug } = {}) {
  assertValidGameSlug(gameSlug);
  let query = supabaseAdmin
    .from('shop_items')
    .select('*')
    .order('created_at', { ascending: false });

  query = query.eq('game_slug', gameSlug);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
