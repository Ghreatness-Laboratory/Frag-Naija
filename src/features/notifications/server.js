import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const MATCH_SELECT = `*, tournament:tournaments(id,name,game_slug,status), notification:notifications(id,title,message,url,created_at)`;

export async function listGamingAlerts({ userId, tournamentId, gameSlug } = {}) {
  let query = supabaseAdmin.from('match_results').select(MATCH_SELECT).order('finalized_at', { ascending: false }).limit(80);
  if (tournamentId) query = query.eq('tournament_id', tournamentId);
  if (gameSlug) query = query.eq('game_slug', gameSlug);
  const { data, error } = await query;
  if (error) throw error;
  const notificationIds = (data || []).map((row) => row.notification?.[0]?.id || row.notification?.id).filter(Boolean);
  let read = new Set();
  if (userId && notificationIds.length) {
    const { data: reads } = await supabaseAdmin.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', notificationIds);
    read = new Set((reads || []).map((r) => r.notification_id));
  }
  return (data || []).map((row) => {
    const notification = Array.isArray(row.notification) ? row.notification[0] : row.notification;
    return { ...row, notification, unread: Boolean(userId && notification?.id && !read.has(notification.id)) };
  });
}

export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { data: notifications, error } = await supabaseAdmin.from('notifications').select('id').eq('type', 'match_result');
  if (error || !notifications?.length) return 0;
  const ids = notifications.map((row) => row.id);
  const { data: reads } = await supabaseAdmin.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', ids);
  const read = new Set((reads || []).map((row) => row.notification_id));
  return ids.filter((id) => !read.has(id)).length;
}

export async function getNotificationSettings(userId) {
  if (!userId) return { match_results_enabled: true };
  const { data, error } = await supabaseAdmin.from('notification_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created } = await supabaseAdmin.from('notification_settings').insert({ user_id: userId }).select('*').single();
  return created || { match_results_enabled: true };
}

export async function saveNotificationSettings(userId, settings) {
  const payload = { user_id: userId, match_results_enabled: settings.match_results_enabled !== false, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin.from('notification_settings').upsert(payload, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function registerFcmToken(userId, token) {
  const { data, error } = await supabaseAdmin.from('fcm_tokens').upsert({ user_id: userId, token, platform: 'web', updated_at: new Date().toISOString() }, { onConflict: 'token' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function markNotificationsRead(userId, ids) {
  if (!userId || !ids?.length) return { ok: true };
  const rows = ids.map((notification_id) => ({ notification_id, user_id: userId }));
  const { error } = await supabaseAdmin.from('notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
  if (error) throw error;
  return { ok: true };
}

export async function createMatchResultAlert(payload) {
  const now = new Date().toISOString();
  const source_type = payload.source_type || 'general';
  const source_id = payload.source_id || null;
  if (source_id) {
    const { data: existing } = await supabaseAdmin.from('match_results').select('id').eq('source_type', source_type).eq('source_id', source_id).maybeSingle();
    if (existing) return { duplicate: true, matchResult: existing };
  }
  const { data: matchResult, error } = await supabaseAdmin.from('match_results').insert({
    source_type, source_id, tournament_id: payload.tournament_id || null, game_slug: payload.game_slug || 'pubg-mobile', match_title: payload.match_title,
    winner_name: payload.winner_name, winner_ref_type: payload.winner_ref_type || 'custom', winner_ref_id: payload.winner_ref_id || null,
    mvp_name: payload.mvp_name, mvp_athlete_id: payload.mvp_athlete_id || null, finalized_at: payload.finalized_at || now, alerted_at: now,
  }).select('*, tournament:tournaments(id,name,game_slug,status)').single();
  if (error) throw error;
  const title = `${matchResult.winner_name} won! MVP: ${matchResult.mvp_name} 🏆`;
  const message = `${matchResult.match_title} result finalized${matchResult.tournament?.name ? ` for ${matchResult.tournament.name}` : ''}.`;
  const url = `/gaming-alerts?alert=${matchResult.id}`;
  const { data: notification, error: nerr } = await supabaseAdmin.from('notifications').insert({ type: 'match_result', match_result_id: matchResult.id, tournament_id: matchResult.tournament_id, game_slug: matchResult.game_slug, title, message, url, metadata: { winner_name: matchResult.winner_name, mvp_name: matchResult.mvp_name } }).select('*').single();
  if (nerr) throw nerr;
  await sendFcmToEligibleUsers({ title, body: message, url });
  return { matchResult, notification };
}


async function getFirebaseAccessToken() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return '';
  const { createSign } = await import('crypto');
  const account = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const signature = createSign('RSA-SHA256').update(`${header}.${claim}`).sign(account.private_key, 'base64url');
  const assertion = `${header}.${claim}.${signature}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) return '';
  const data = await response.json();
  return data.access_token || '';
}

export async function sendFcmToEligibleUsers({ title, body, url }) {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'frag-naija-21727';
  const accessToken = await getFirebaseAccessToken();
  if (!accessToken) return { skipped: 'Missing FIREBASE_SERVICE_ACCOUNT_JSON' };
  const { data: tokens } = await supabaseAdmin.from('fcm_tokens').select('token,user_id');
  const userIds = Array.from(new Set((tokens || []).map((row) => row.user_id)));
  const { data: settings } = userIds.length ? await supabaseAdmin.from('notification_settings').select('user_id,match_results_enabled').in('user_id', userIds) : { data: [] };
  const disabled = new Set((settings || []).filter((row) => row.match_results_enabled === false).map((row) => row.user_id));
  const eligible = (tokens || []).filter((row) => !disabled.has(row.user_id));
  await Promise.all(eligible.map((row) => fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { token: row.token, notification: { title, body }, webpush: { fcm_options: { link: url }, notification: { icon: '/icons/icon.svg', badge: '/icons/icon.svg', tag: 'fn-gaming-alert' } }, data: { title, body, url } } }),
  }).catch(() => null)));
  return { sent: eligible.length };
}
