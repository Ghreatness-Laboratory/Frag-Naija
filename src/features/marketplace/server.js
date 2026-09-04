import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const FIELDS = ['display_name', 'ign', 'game_slug', 'photo_url', 'is_free_agent', 'previous_teams', 'gameplay_link', 'device_used', 'availability', 'tournaments_free_for', 'achievements', 'loan_available', 'loan_conditions', 'highlight_requested'];
const BOOLEAN_FIELDS = ['is_free_agent', 'loan_available', 'highlight_requested'];
const IDENTITY_FIELDS = ['display_name', 'ign', 'game_slug', 'photo_url'];

function cleanPayload(body = {}) {
  const data = {};
  for (const field of FIELDS) data[field] = body[field] ?? (BOOLEAN_FIELDS.includes(field) ? false : '');
  for (const field of BOOLEAN_FIELDS) data[field] = Boolean(data[field]);
  for (const field of FIELDS.filter((field) => !BOOLEAN_FIELDS.includes(field))) data[field] = String(data[field] ?? '').trim();
  for (const field of ['display_name', 'ign', 'game_slug']) if (!data[field]) throw new Error(`${field.replaceAll('_', ' ')} is required.`);
  for (const field of ['gameplay_link', 'photo_url']) {
    if (!data[field]) continue;
    try { new URL(data[field]); } catch { throw new Error(`${field === 'photo_url' ? 'Photo URL' : 'Gameplay link'} must be a valid URL.`); }
  }
  return data;
}

function identityFrom(data) {
  return Object.fromEntries(IDENTITY_FIELDS.map((field) => [field, data[field] || null]));
}

export async function getMyMarketplaceListing(userId) {
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { listing: data };
}

export async function submitMarketplaceListing(userId, body) {
  const pending_data = cleanPayload(body);
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').upsert({
    user_id: userId,
    ...identityFrom(pending_data),
    pending_data,
    highlight_requested: pending_data.highlight_requested,
    review_status: 'pending',
    reviewer_note: null,
    reviewed_at: null,
    reviewed_by: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  return { listing: data };
}

export async function getPublicMarketplaceListings({ game_slug, free_agent, loan_available } = {}) {
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select('id,public_data,display_name,ign,game_slug,photo_url,highlight_granted,updated_at').eq('review_status', 'approved').not('public_data', 'is', null).order('highlight_granted', { ascending: false }).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => {
    const publicData = row.public_data || {};
    return { ...row, display_name: publicData.display_name || row.display_name, ign: publicData.ign || row.ign, game_slug: publicData.game_slug || row.game_slug, photo_url: publicData.photo_url || row.photo_url, public_data: publicData };
  }).filter((row) => (!game_slug || row.game_slug === game_slug) && (free_agent === undefined || row.public_data?.is_free_agent === free_agent) && (loan_available === undefined || row.public_data?.loan_available === loan_available));
}

export async function getMarketplaceReviewQueue() {
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function reviewMarketplaceListing(id, { action, note }, adminId = 'admin') {
  if (!['approve', 'reject', 'request_changes', 'grant_highlight', 'revoke_highlight'].includes(action)) throw new Error('Invalid review action.');
  const { data: existing, error: readError } = await supabaseAdmin.from('athlete_marketplace_listings').select('*').eq('id', id).single();
  if (readError) throw readError;

  if (action === 'grant_highlight' || action === 'revoke_highlight') {
    if (action === 'grant_highlight' && !existing.highlight_requested) throw new Error('This listing has not requested a highlight.');
    const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').update({ highlight_granted: action === 'grant_highlight', updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  }

  const review_status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
  const update = { review_status, reviewer_note: String(note || '').trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: adminId, updated_at: new Date().toISOString() };
  if (action === 'approve') {
    update.public_data = existing.pending_data;
    Object.assign(update, identityFrom(existing.pending_data || {}));
  }
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').update(update).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}
