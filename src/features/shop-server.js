import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getShopProducts({ featured } = {}) {
  let query = supabaseAdmin
    .from('shop_products')
    .select('*')
    .eq('status', 'Active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (featured === true) query = query.eq('featured', true);

  const { data, error } = await query;
  if (error) throw error;

  return data;
}
