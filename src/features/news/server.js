import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getAllNews({ published } = {}) {
  let query = supabaseAdmin
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (published === true) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function getNewsById(id) {
  const { data, error } = await supabaseAdmin
    .from('news')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;

  return data;
}

export async function createNews(body) {
  const { title, content, image_url, author, published } = body;

  const { data, error } = await supabaseAdmin
    .from('news')
    .insert([{ title, content, image_url, author, published: published ?? false }])
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function updateNews(id, body) {
  const { title, content, image_url, author, published } = body;

  const updates = {};
  if (title !== undefined)     updates.title     = title;
  if (content !== undefined)   updates.content   = content;
  if (image_url !== undefined) updates.image_url = image_url;
  if (author !== undefined)    updates.author    = author;
  if (published !== undefined) updates.published = published;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('news')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function deleteNews(id) {
  const { error } = await supabaseAdmin.from('news').delete().eq('id', id);
  if (error) throw error;
}
