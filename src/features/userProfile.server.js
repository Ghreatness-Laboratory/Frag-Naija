import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

function ageFromDob(dob) {
  if (!dob) return null;
  const date = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function validateMinimumAge(dateOfBirth, minimumAge) {
  const age = ageFromDob(dateOfBirth);
  return age !== null && age >= minimumAge;
}

export async function ensureUserProfile(userId, { username, date_of_birth, referred_by } = {}) {
  const payload = { user_id: userId };
  if (username !== undefined) payload.username = username;
  if (date_of_birth !== undefined) payload.date_of_birth = date_of_birth || null;
  if (referred_by) payload.referred_by = referred_by;
  const { data, error } = await supabaseAdmin.from('user_profiles').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  await supabaseAdmin.from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id' });
  return data;
}

export async function getUserProfile(userId) {
  const { data } = await supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).single();
  return data || await ensureUserProfile(userId);
}

export async function updateUserProfile(userId, { username, date_of_birth }) {
  if (date_of_birth && !validateMinimumAge(date_of_birth, 16)) throw new Error('You must be at least 16 years old to use FragNaija.');
  const { data, error } = await supabaseAdmin.from('user_profiles').upsert({ user_id: userId, username: username || null, date_of_birth: date_of_birth || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  if (username) await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { username } }).catch(() => {});
  return data;
}

export async function getUserSettings(userId) {
  const { data } = await supabaseAdmin.from('user_settings').select('*').eq('user_id', userId).single();
  if (data) return data;
  await ensureUserProfile(userId);
  const { data: next } = await supabaseAdmin.from('user_settings').select('*').eq('user_id', userId).single();
  return next;
}

export async function updateUserSettings(userId, body) {
  const payload = { user_id: userId, updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(body, 'show_notification_shortcuts')) payload.show_notification_shortcuts = Boolean(body.show_notification_shortcuts);
  if (Object.prototype.hasOwnProperty.call(body, 'match_alerts_enabled')) payload.match_alerts_enabled = Boolean(body.match_alerts_enabled);
  const { data, error } = await supabaseAdmin.from('user_settings').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function assertUserAtLeast(userId, minimumAge) {
  const profile = await getUserProfile(userId);
  if (!validateMinimumAge(profile?.date_of_birth, minimumAge)) {
    throw new Error(`You must be ${minimumAge} or older to place wagers.`);
  }
  return profile;
}

export async function resolveReferralCode(code) {
  if (!code) return null;
  const { data } = await supabaseAdmin.from('user_profiles').select('user_id').eq('referral_code', String(code).trim().toUpperCase()).single();
  return data?.user_id || null;
}
