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


function cleanShopItem(body) {
  return {
    name: body.name || '',
    description: body.description || null,
    price: Number(body.price ?? 0) || 0,
    currency: body.currency || 'NGN',
    image_url: body.image_url || null,
    category: body.category || 'Gear',
    status: body.status || 'Published',
    game_slug: body.game_slug || null,
    tutorial_video_url: body.tutorial_video_url || null,
  };
}

export async function createShopItem(body) {
  const { data, error } = await supabaseAdmin.from('shop_items').insert(cleanShopItem(body)).select().single();
  if (error) throw error;
  return data;
}

export async function updateShopItem(id, body) {
  const { data, error } = await supabaseAdmin.from('shop_items').update(cleanShopItem(body)).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteShopItem(id) {
  const { error } = await supabaseAdmin.from('shop_items').delete().eq('id', id);
  if (error) throw error;
}
