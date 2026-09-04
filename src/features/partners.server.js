import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const PARTNER_FIELDS = 'id,name,logo_url,website_url,sort_order,status,created_at,updated_at';
const FIELDS = new Set(['name', 'logo_url', 'website_url', 'sort_order', 'status']);

function payload(body = {}) {
  const row = {};
  for (const [key, value] of Object.entries(body)) {
    if (!FIELDS.has(key)) continue;
    row[key] = key === 'sort_order' ? Number(value || 0) : (value === '' ? null : value);
  }
  if (!row.name || !row.logo_url) throw new Error('Name and logo are required.');
  if (row.website_url) { try { new URL(row.website_url); } catch { throw new Error('Website URL must be valid.'); } }
  row.updated_at = new Date().toISOString();
  return row;
}

export async function listPartners({ includeDrafts = false } = {}) {
  let query = supabaseAdmin.from('partners').select(PARTNER_FIELDS).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (!includeDrafts) query = query.eq('status', 'Published');
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createPartner(body) { const { data, error } = await supabaseAdmin.from('partners').insert([payload(body)]).select(PARTNER_FIELDS).single(); if (error) throw error; return data; }
export async function updatePartner(id, body) { const { data, error } = await supabaseAdmin.from('partners').update(payload(body)).eq('id', id).select(PARTNER_FIELDS).single(); if (error) throw error; return data; }
export async function deletePartner(id) { const { error } = await supabaseAdmin.from('partners').delete().eq('id', id); if (error) throw error; return { ok: true }; }
