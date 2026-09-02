import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const ATHLETE_SELECT = 'id,name,ign,known_name,game_slug,team,role,photo_url,overall_rating,rating';
const FIELDS = ['is_free_agent', 'previous_teams', 'gameplay_link', 'device_used', 'availability', 'tournaments_free_for', 'achievements', 'loan_available', 'loan_conditions'];

function cleanPayload(body = {}) {
  const data = {};
  for (const field of FIELDS) data[field] = body[field] ?? (field === 'is_free_agent' || field === 'loan_available' ? false : '');
  data.is_free_agent = Boolean(data.is_free_agent);
  data.loan_available = Boolean(data.loan_available);
  for (const field of FIELDS.filter((field) => !['is_free_agent', 'loan_available'].includes(field))) data[field] = String(data[field] ?? '').trim();
  if (data.gameplay_link) {
    try { new URL(data.gameplay_link); } catch { throw new Error('Gameplay link must be a valid URL.'); }
  }
  return data;
}

async function ownedAthlete(userId) {
  const { data, error } = await supabaseAdmin.from('athletes').select(ATHLETE_SELECT).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyMarketplaceListing(userId) {
  const athlete = await ownedAthlete(userId);
  if (!athlete) return { athlete: null, listing: null };
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select('*').eq('athlete_id', athlete.id).maybeSingle();
  if (error) throw error;
  return { athlete, listing: data };
}

export async function submitMarketplaceListing(userId, body) {
  const athlete = await ownedAthlete(userId);
  if (!athlete) throw new Error('Your account is not linked to a tracked athlete profile. Ask an administrator to link it before submitting a listing.');
  const pending_data = cleanPayload(body);
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').upsert({
    athlete_id: athlete.id, pending_data, review_status: 'pending', reviewer_note: null, reviewed_at: null, reviewed_by: null, updated_at: new Date().toISOString(),
  }, { onConflict: 'athlete_id' }).select('*').single();
  if (error) throw error;
  return { athlete, listing: data };
}

export async function getPublicMarketplaceListings({ game_slug, free_agent, loan_available } = {}) {
  // public_data is the last moderator-approved snapshot. It remains visible while
  // an edit is pending, so unapproved edits can never replace the live profile.
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select(`id,athlete_id,public_data,updated_at,athlete:athletes(${ATHLETE_SELECT})`).not('public_data', 'is', null).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).filter((row) => (!game_slug || row.athlete?.game_slug === game_slug) && (free_agent === undefined || row.public_data?.is_free_agent === free_agent) && (loan_available === undefined || row.public_data?.loan_available === loan_available));
}

export async function getMarketplaceReviewQueue() {
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').select(`*,athlete:athletes(${ATHLETE_SELECT})`).order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function reviewMarketplaceListing(id, { action, note }, adminId = 'admin') {
  if (!['approve', 'reject', 'request_changes'].includes(action)) throw new Error('Invalid review action.');
  const { data: existing, error: readError } = await supabaseAdmin.from('athlete_marketplace_listings').select('*').eq('id', id).single();
  if (readError) throw readError;
  const review_status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
  const update = { review_status, reviewer_note: String(note || '').trim() || null, reviewed_at: new Date().toISOString(), reviewed_by: adminId, updated_at: new Date().toISOString() };
  if (action === 'approve') update.public_data = existing.pending_data;
  const { data, error } = await supabaseAdmin.from('athlete_marketplace_listings').update(update).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}
