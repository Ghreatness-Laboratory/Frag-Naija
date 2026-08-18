import crypto from 'node:crypto';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const MATCH_SELECT = `*, tournament:tournaments(id,name,game_slug,status), notification:notifications(id,title,message,url,created_at)`;
const OPEN_TOURNAMENT_STATUSES = new Set(['upcoming', 'live']);
const OPEN_MATCH_STATUSES = new Set(['scheduled', 'upcoming', 'live']);

function base64Url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function readFirebaseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  const account = JSON.parse(raw);
  if (!account.project_id || !account.client_email || !account.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id, client_email, or private_key');
  return account;
}

let cachedAccessToken = null;
async function getFirebaseAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) return cachedAccessToken.token;
  const account = readFirebaseServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = `${base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64Url(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))}`;
  const signature = crypto.createSign('RSA-SHA256').update(assertion).sign(account.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${assertion}.${signature}` }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Firebase access token request failed: ${data.error_description || data.error || res.statusText}`);
  cachedAccessToken = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return cachedAccessToken.token;
}

export async function listTournamentMatches({ tournamentId } = {}) {
  let query = supabaseAdmin
    .from('tournament_matches')
    .select('*, tournament:tournaments(id,name,game_slug,status)')
    .order('starts_at', { ascending: true, nullsFirst: false });
  if (tournamentId) query = query.eq('tournament_id', tournamentId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listGamingAlerts({ userId, tournamentId, gameSlug } = {}) {
  let query = supabaseAdmin.from('match_results').select(MATCH_SELECT).not('tournament_id', 'is', null).order('finalized_at', { ascending: false }).limit(80);
  if (tournamentId) query = query.eq('tournament_id', tournamentId);
  if (gameSlug) {
    const { data: scopedTournaments, error: tournamentError } = await supabaseAdmin.from('tournaments').select('id').eq('game_slug', gameSlug);
    if (tournamentError) throw tournamentError;
    const tournamentIds = (scopedTournaments || []).map((item) => item.id);
    if (!tournamentIds.length) return [];
    query = query.in('tournament_id', tournamentIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const sourceIds = rows.filter((row) => row.source_type === 'tournament_match' && row.source_id).map((row) => row.source_id);
  let sourceMatches = new Map();
  if (sourceIds.length) {
    const { data: matches } = await supabaseAdmin.from('tournament_matches').select('id,title,status,starts_at,game_slug,tournament_id').in('id', sourceIds);
    sourceMatches = new Map((matches || []).map((match) => [match.id, match]));
  }
  const matchIds = rows.map((row) => row.id).filter(Boolean);
  const notificationIds = (data || []).map((row) => row.notification?.[0]?.id || row.notification?.id).filter(Boolean);
  let read = new Set();
  let subscribed = new Set();
  if (userId && notificationIds.length) {
    const { data: reads } = await supabaseAdmin.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', notificationIds);
    read = new Set((reads || []).map((r) => r.notification_id));
  }
  if (userId && matchIds.length) {
    const { data: subs } = await supabaseAdmin.from('match_notification_subscriptions').select('match_result_id').eq('user_id', userId).in('match_result_id', matchIds);
    subscribed = new Set((subs || []).map((r) => r.match_result_id));
  }
  return rows.map((row) => {
    const notification = Array.isArray(row.notification) ? row.notification[0] : row.notification;
    const source_match = sourceMatches.get(row.source_id) || null;
    return { ...row, source_match, notification, unread: Boolean(userId && notification?.id && !read.has(notification.id)), subscribed: subscribed.has(row.id) };
  });
}


export async function upsertTournamentMatchState(payload) {
  const tournament = await getTournamentForMatchResult(payload.tournament_id || null);
  const status = String(payload.status || 'upcoming').toLowerCase();
  const normalizedStatus = status === 'scheduled' ? 'upcoming' : status === 'completed' ? 'finished' : status;
  if (!['upcoming', 'live', 'finished'].includes(normalizedStatus)) throw new Error('Match status must be upcoming, live, or finished.');
  const body = {
    tournament_id: tournament.id,
    game_slug: tournament.game_slug || 'pubg-mobile',
    title: String(payload.match_title || payload.title || '').trim(),
    team_a: payload.team_a || null,
    team_b: payload.team_b || null,
    starts_at: payload.starts_at || null,
    status: normalizedStatus === 'finished' ? 'completed' : normalizedStatus === 'upcoming' ? 'scheduled' : normalizedStatus,
    live_state: {
      score_a: payload.score_a || '',
      score_b: payload.score_b || '',
      current_round: payload.current_round || '',
      current_map: payload.current_map || '',
      elapsed: payload.elapsed || '',
      notes: payload.live_notes || payload.notes || '',
    },
    updated_at: new Date().toISOString(),
  };
  if (!body.title) throw new Error('match_title is required');

  if (payload.source_id) {
    const { data, error } = await supabaseAdmin
      .from('tournament_matches')
      .update(body)
      .eq('id', payload.source_id)
      .eq('tournament_id', tournament.id)
      .select('id,tournament_id,title,game_slug,status,starts_at,team_a,team_b,live_state')
      .single();
    if (error) throw error;
    return { tournament, match: data };
  }

  const { data, error } = await supabaseAdmin
    .from('tournament_matches')
    .insert(body)
    .select('id,tournament_id,title,game_slug,status,starts_at,team_a,team_b,live_state')
    .single();
  if (error) throw error;
  return { tournament, match: data };
}

export async function listGamingTracker({ userId, tournamentId, gameSlug, status } = {}) {
  let tournamentsQuery = supabaseAdmin.from('tournaments').select('*').order('start_date', { ascending: false });
  if (tournamentId) tournamentsQuery = tournamentsQuery.eq('id', tournamentId);
  if (gameSlug) tournamentsQuery = tournamentsQuery.eq('game_slug', gameSlug);
  const { data: tournaments, error: tournamentError } = await tournamentsQuery;
  if (tournamentError) throw tournamentError;
  const tournamentIds = (tournaments || []).map((item) => item.id);
  if (!tournamentIds.length) return { tournaments: [], matches: [] };

  let matchesQuery = supabaseAdmin.from('tournament_matches').select('*').in('tournament_id', tournamentIds).order('starts_at', { ascending: true, nullsFirst: false });
  if (status) {
    const normalized = status === 'finished' ? 'completed' : status;
    matchesQuery = matchesQuery.eq('status', normalized);
  }
  const { data: matches, error: matchError } = await matchesQuery;
  if (matchError) throw matchError;
  const matchIds = (matches || []).map((match) => match.id);
  const { data: results } = matchIds.length ? await supabaseAdmin.from('match_results').select('*').eq('source_type', 'tournament_match').in('source_id', matchIds) : { data: [] };
  const resultByMatch = new Map((results || []).map((result) => [result.source_id, result]));
  let subscribed = new Set();
  if (userId && matchIds.length) {
    const resultIds = (results || []).map((result) => result.id);
    const { data: subsByMatch } = await supabaseAdmin.from('match_notification_subscriptions').select('match_result_id,tournament_match_id').eq('user_id', userId).or(`tournament_match_id.in.(${matchIds.join(',')})${resultIds.length ? `,match_result_id.in.(${resultIds.join(',')})` : ''}`);
    subscribed = new Set((subsByMatch || []).flatMap((row) => [row.match_result_id, row.tournament_match_id].filter(Boolean)));
  }
  const tournamentById = new Map((tournaments || []).map((item) => [item.id, item]));
  return {
    tournaments: tournaments || [],
    matches: (matches || []).map((match) => {
      const result = resultByMatch.get(match.id) || null;
      return { ...match, display_status: match.status === 'completed' ? 'finished' : match.status === 'scheduled' ? 'upcoming' : match.status, tournament: tournamentById.get(match.tournament_id), result, subscribed: subscribed.has(match.id) || (result ? subscribed.has(result.id) : false) };
    }),
  };
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

export async function setMatchNotificationSubscription(userId, matchResultId, subscribed, tournamentMatchId = null) {
  if (subscribed) {
    if (tournamentMatchId && !matchResultId) {
      const { data: sourceMatch, error: sourceError } = await supabaseAdmin
        .from('tournament_matches')
        .select('id,status,tournament:tournaments(id,status)')
        .eq('id', tournamentMatchId)
        .single();
      if (sourceError || !sourceMatch) throw new Error('Tournament match not found.');
      const tournamentStatus = String(sourceMatch.tournament?.status || '').toLowerCase();
      const matchStatus = String(sourceMatch.status || '').toLowerCase();
      if (!OPEN_TOURNAMENT_STATUSES.has(tournamentStatus) || !OPEN_MATCH_STATUSES.has(matchStatus)) {
        throw new Error('Match alerts can only be enabled for upcoming or live matches.');
      }
      const { data, error } = await supabaseAdmin
        .from('match_notification_subscriptions')
        .upsert({ user_id: userId, tournament_match_id: tournamentMatchId }, { onConflict: 'user_id,tournament_match_id' })
        .select('*')
        .single();
      if (error) throw error;
      return { subscribed: true, row: data };
    }
    const { data: matchResult, error: matchError } = await supabaseAdmin
      .from('match_results')
      .select('id,source_id,source_type,tournament:tournaments(id,status)')
      .eq('id', matchResultId)
      .single();
    if (matchError || !matchResult) throw new Error('Match result not found.');

    const tournamentStatus = String(matchResult.tournament?.status || '').toLowerCase();
    if (!OPEN_TOURNAMENT_STATUSES.has(tournamentStatus)) {
      throw new Error('Match alerts can only be enabled for upcoming or live tournaments.');
    }

    if (matchResult.source_type === 'tournament_match' && matchResult.source_id) {
      const { data: sourceMatch, error: sourceError } = await supabaseAdmin
        .from('tournament_matches')
        .select('status')
        .eq('id', matchResult.source_id)
        .maybeSingle();
      if (sourceError) throw sourceError;
      const matchStatus = String(sourceMatch?.status || '').toLowerCase();
      if (sourceMatch && !OPEN_MATCH_STATUSES.has(matchStatus)) {
        throw new Error('Match alerts can only be enabled for upcoming or live matches.');
      }
    }
    const { data, error } = await supabaseAdmin.from('match_notification_subscriptions').upsert({ user_id: userId, match_result_id: matchResultId }, { onConflict: 'user_id,match_result_id' }).select('*').single();
    if (error) throw error;
    return { subscribed: true, row: data };
  }
  let deleteQuery = supabaseAdmin.from('match_notification_subscriptions').delete().eq('user_id', userId);
  deleteQuery = tournamentMatchId && !matchResultId ? deleteQuery.eq('tournament_match_id', tournamentMatchId) : deleteQuery.eq('match_result_id', matchResultId);
  const { error } = await deleteQuery;
  if (error) throw error;
  return { subscribed: false };
}

export async function markNotificationsRead(userId, ids) {
  if (!userId || !ids?.length) return { ok: true };
  const rows = ids.map((notification_id) => ({ notification_id, user_id }));
  const { error } = await supabaseAdmin.from('notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
  if (error) throw error;
  return { ok: true };
}

async function getTournamentForMatchResult(tournamentId) {
  if (!tournamentId) throw new Error('Select an existing tournament before finalizing a match result.');
  const { data: tournament, error } = await supabaseAdmin
    .from('tournaments')
    .select('id,name,game_slug,status')
    .eq('id', tournamentId)
    .single();
  if (error || !tournament) throw new Error('Selected tournament was not found.');
  return tournament;
}

async function createTournamentMatchFromResult(tournament, payload) {
  const existing = await upsertTournamentMatchState({ ...payload, tournament_id: tournament.id, status: 'finished' });
  return existing.match;
}


export async function createMatchResultAlert(payload) {
  const now = new Date().toISOString();
  const source_type = payload.source_type || 'tournament_match';
  const tournament_id = payload.tournament_id || null;
  const tournament = await getTournamentForMatchResult(tournament_id);
  const sourceMatch = payload.source_id ? (await upsertTournamentMatchState({ ...payload, tournament_id, status: 'finished' })).match : await createTournamentMatchFromResult(tournament, payload);
  const source_id = sourceMatch.id;
  if (source_id) {
    const { data: existing } = await supabaseAdmin.from('match_results').select('id').eq('source_type', source_type).eq('source_id', source_id).maybeSingle();
    if (existing) return { duplicate: true, matchResult: existing };
  }
  const { data: matchResult, error } = await supabaseAdmin.from('match_results').insert({
    source_type, source_id, tournament_id, game_slug: tournament.game_slug || sourceMatch.game_slug || 'pubg-mobile', match_title: sourceMatch.title,
    winner_name: payload.winner_name, winner_ref_type: payload.winner_ref_type || 'custom', winner_ref_id: payload.winner_ref_id || null,
    mvp_name: payload.mvp_name, mvp_athlete_id: payload.mvp_athlete_id || null,
    placement_3_name: payload.placement_3_name || null, placement_4_name: payload.placement_4_name || null,
    finalized_at: payload.finalized_at || now, alerted_at: now,
  }).select('*, tournament:tournaments(id,name,game_slug,status)').single();
  if (error) throw error;
  const title = `${matchResult.winner_name} won! MVP: ${matchResult.mvp_name} 🏆`;
  const message = `${matchResult.match_title} result finalized for ${matchResult.tournament?.name || 'the selected tournament'}.`;
  const url = `/gaming-alerts?alert=${matchResult.id}`;
  const { data: notification, error: nerr } = await supabaseAdmin.from('notifications').insert({ type: 'match_result', match_result_id: matchResult.id, tournament_id: matchResult.tournament_id, game_slug: matchResult.game_slug, title, message, url, metadata: { winner_name: matchResult.winner_name, mvp_name: matchResult.mvp_name, placement_3_name: matchResult.placement_3_name, placement_4_name: matchResult.placement_4_name } }).select('*').single();
  if (nerr) throw nerr;
  let push = null;
  try {
    push = await sendFcmToEligibleUsers({ title, body: message, url, matchResultId: matchResult.id });
  } catch (error) {
    push = { sent: 0, attempted: 0, error: error.message };
    console.error('Gaming Alerts FCM dispatch failed after result save:', error);
  }
  return { matchResult, notification, push };
}

export async function sendFcmToEligibleUsers({ title, body, url, matchResultId }) {
  const account = readFirebaseServiceAccount();
  const { data: tokens } = await supabaseAdmin.from('fcm_tokens').select('token,user_id');
  const userIds = Array.from(new Set((tokens || []).map((row) => row.user_id)));
  const { data: settings } = userIds.length ? await supabaseAdmin.from('notification_settings').select('user_id,match_results_enabled').in('user_id', userIds) : { data: [] };
  const disabled = new Set((settings || []).filter((row) => row.match_results_enabled === false).map((row) => row.user_id));
  const { data: resultRow } = matchResultId ? await supabaseAdmin.from('match_results').select('source_id').eq('id', matchResultId).maybeSingle() : { data: null };
  const { data: subs } = matchResultId && userIds.length ? await supabaseAdmin.from('match_notification_subscriptions').select('user_id').in('user_id', userIds).or(`match_result_id.eq.${matchResultId}${resultRow?.source_id ? `,tournament_match_id.eq.${resultRow.source_id}` : ''}`) : { data: [] };
  const matchSubscribers = new Set((subs || []).map((row) => row.user_id));
  const eligible = (tokens || []).filter((row) => !disabled.has(row.user_id) || matchSubscribers.has(row.user_id));
  const accessToken = await getFirebaseAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const results = await Promise.all(eligible.map(async (row) => {
    const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token: row.token, notification: { title, body }, webpush: { notification: { icon: '/icons/icon.svg', badge: '/icons/icon.svg', tag: matchResultId || 'fn-gaming-alert' }, fcm_options: { link: url } }, data: { url, matchResultId: matchResultId || '' } } }) });
    return { ok: res.ok, status: res.status, user_id: row.user_id };
  }));
  return { sent: results.filter((r) => r.ok).length, attempted: eligible.length };
}
