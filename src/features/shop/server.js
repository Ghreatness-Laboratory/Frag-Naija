import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getShopItems({ status } = {}) {
  let query = supabaseAdmin
    .from('shop_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
