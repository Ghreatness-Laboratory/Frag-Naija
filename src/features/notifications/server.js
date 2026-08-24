import crypto from 'node:crypto';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const MATCH_SELECT = `id,source_type,source_id,tournament_id,game_slug,match_title,winner_name,winner_ref_type,winner_ref_id,mvp_name,mvp_athlete_id,placement_3_name,placement_4_name,finalized_at,alerted_at,created_at,tournament:tournaments(id,name,game_slug,status),notification:notifications(id,title,message,url,created_at)`;
const TRACKER_TOURNAMENT_SELECT = 'id,name,game_slug,status,start_date,end_date,created_at,updated_at';
const TRACKER_MATCH_SELECT = 'id,tournament_id,game_slug,title,status,starts_at,team_a,team_b,live_state,live_events,created_at,updated_at';
const MATCH_RESULT_SELECT = 'id,source_id,source_type,tournament_id,game_slug,match_title,winner_name,mvp_name,placement_3_name,placement_4_name,finalized_at,created_at';
const NOTIFICATION_SETTINGS_SELECT = 'id,user_id,match_results_enabled,created_at,updated_at';
const FCM_TOKEN_SELECT = 'id,user_id,token,platform,created_at,updated_at';
const SUBSCRIPTION_SELECT = 'id,user_id,match_result_id,tournament_match_id,tournament_id,created_at';
const NOTIFICATION_SELECT = 'id,type,title,message,url,match_result_id,tournament_match_id,tournament_id,game_slug,metadata,created_at';
const OPEN_TOURNAMENT_STATUSES = new Set(['upcoming', 'live']);
const OPEN_MATCH_STATUSES = new Set(['scheduled', 'upcoming', 'live']);

function normalizeTrackerStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'completed' || status === 'finished') return 'finished';
  if (status === 'live') return 'live';
  return 'upcoming';
}

function deriveTournamentDisplayStatus(tournament) {
  const stored = normalizeTrackerStatus(tournament?.status);
  if (stored === 'live' || stored === 'finished') return stored;
  const startDate = tournament?.start_date ? new Date(tournament.start_date) : null;
  const endDate = tournament?.end_date ? new Date(tournament.end_date) : null;
  const now = Date.now();
  if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now) return 'finished';
  if (startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() <= now) return 'live';
  return 'upcoming';
}

function deriveMatchDisplayStatus(match) {
  const stored = normalizeTrackerStatus(match?.status);
  if (stored === 'live' || stored === 'finished') return stored;
  const startsAt = match?.starts_at ? new Date(match.starts_at) : null;
  if (startsAt && !Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= Date.now()) return 'live';
  return 'upcoming';
}

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
  return (data || []).map((match) => ({ ...match, display_status: deriveMatchDisplayStatus(match) }));
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


export async function listGamingNotifications({ userId, tournamentId, gameSlug } = {}) {
  if (!userId) return [];
  let query = supabaseAdmin
    .from('notification_recipients')
    .select('notification:notifications!inner(id,type,title,message,url,tournament_id,game_slug,metadata,created_at,tournament:tournaments(id,name,game_slug,status))')
    .eq('user_id', userId)
    .order('delivered_at', { ascending: false })
    .limit(80);
  if (tournamentId) query = query.eq('notification.tournament_id', tournamentId);
  if (gameSlug) query = query.eq('notification.game_slug', gameSlug);
  const { data: recipientRows, error } = await query;
  const data = (recipientRows || []).map((row) => Array.isArray(row.notification) ? row.notification[0] : row.notification).filter(Boolean);
  if (error) throw error;
  const ids = (data || []).map((row) => row.id);
  let read = new Set();
  if (userId && ids.length) {
    const { data: reads } = await supabaseAdmin.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', ids);
    read = new Set((reads || []).map((row) => row.notification_id));
  }
  return (data || []).map((row) => ({ ...row, unread: Boolean(userId && !read.has(row.id)) }));
}



function formatMatchNotificationTitle(match, tournament) {
  const teamA = String(match?.team_a || '').trim();
  const teamB = String(match?.team_b || '').trim();
  if (teamA && teamB) return `${teamA} vs ${teamB}`;
  return String(match?.title || tournament?.name || 'FragNaija match update').trim();
}

function matchNotificationUrl(tournamentId, matchId) {
  const qs = new URLSearchParams();
  if (tournamentId) qs.set('tournament', tournamentId);
  if (matchId) qs.set('match', matchId);
  return `/gaming-alerts?${qs.toString()}`;
}

export async function upsertTournamentMatchState(payload) {
  const tournament = await getTournamentForMatchResult(payload.tournament_id || null);
  let previousMatch = null;
  if (payload.source_id) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('tournament_matches')
      .select('id,status,live_events')
      .eq('id', payload.source_id)
      .maybeSingle();
    if (existingError) throw existingError;
    previousMatch = existing || null;
  }
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
  const liveEvent = payload.stat_type || payload.actor ? {
    round: Number(payload.event_round || payload.current_round || 0) || null,
    stat_type: String(payload.stat_type || 'update').trim(),
    actor: String(payload.actor || payload.team_a || payload.team_b || 'Admin update').trim(),
    timestamp: payload.event_timestamp || new Date().toISOString(),
  } : null;
  if (liveEvent) body.live_events = [...(Array.isArray(previousMatch?.live_events) ? previousMatch.live_events : []), liveEvent];
  if (!body.title) throw new Error('match_title is required');

  if (payload.source_id) {
    const { data, error } = await supabaseAdmin
      .from('tournament_matches')
      .update(body)
      .eq('id', payload.source_id)
      .eq('tournament_id', tournament.id)
      .select('id,tournament_id,title,game_slug,status,starts_at,team_a,team_b,live_state,live_events')
      .single();
    if (error) throw error;
    const wentLive = normalizeTrackerStatus(previousMatch?.status) !== 'live' && normalizedStatus === 'live';
    const push = wentLive ? await createMatchLiveAlert({ tournament, match: data }).catch((error) => ({ sent: 0, attempted: 0, error: error.message })) : null;
    return { tournament, match: data, liveEvent, push };
  }

  const { data, error } = await supabaseAdmin
    .from('tournament_matches')
    .insert(body)
    .select('id,tournament_id,title,game_slug,status,starts_at,team_a,team_b,live_state,live_events')
    .single();
  if (error) throw error;
  const push = normalizedStatus === 'live' ? await createMatchLiveAlert({ tournament, match: data }).catch((error) => ({ sent: 0, attempted: 0, error: error.message })) : null;
  return { tournament, match: data, liveEvent, push };
}

export async function listGamingTracker({ userId, tournamentId, gameSlug, status } = {}) {
  let tournamentsQuery = supabaseAdmin.from('tournaments').select(TRACKER_TOURNAMENT_SELECT).order('start_date', { ascending: false });
  if (tournamentId) tournamentsQuery = tournamentsQuery.eq('id', tournamentId);
  if (gameSlug) tournamentsQuery = tournamentsQuery.eq('game_slug', gameSlug);
  const { data: tournaments, error: tournamentError } = await tournamentsQuery;
  if (tournamentError) throw tournamentError;
  const tournamentIds = (tournaments || []).map((item) => item.id);
  if (!tournamentIds.length) return { tournaments: [], matches: [] };

  let matchesQuery = supabaseAdmin.from('tournament_matches').select(TRACKER_MATCH_SELECT).in('tournament_id', tournamentIds).order('starts_at', { ascending: true, nullsFirst: false });
  if (status) {
    const normalized = status === 'finished' ? 'completed' : status;
    matchesQuery = matchesQuery.eq('status', normalized);
  }
  const { data: matches, error: matchError } = await matchesQuery;
  if (matchError) throw matchError;
  const matchIds = (matches || []).map((match) => match.id);
  const { data: results } = matchIds.length ? await supabaseAdmin.from('match_results').select(MATCH_RESULT_SELECT).eq('source_type', 'tournament_match').in('source_id', matchIds) : { data: [] };
  const resultByMatch = new Map((results || []).map((result) => [result.source_id, result]));
  let subscribed = new Set();
  let tournamentSubscribed = new Set();
  if (userId && tournamentIds.length) {
    const { data: tournamentSubs } = await supabaseAdmin.from('tournament_notification_subscriptions').select('tournament_id').eq('user_id', userId).in('tournament_id', tournamentIds);
    tournamentSubscribed = new Set((tournamentSubs || []).map((row) => row.tournament_id));
  }
  if (userId && matchIds.length) {
    const resultIds = (results || []).map((result) => result.id);
    const { data: subsByMatch } = await supabaseAdmin.from('match_notification_subscriptions').select('match_result_id,tournament_match_id').eq('user_id', userId).or(`tournament_match_id.in.(${matchIds.join(',')})${resultIds.length ? `,match_result_id.in.(${resultIds.join(',')})` : ''}`);
    subscribed = new Set((subsByMatch || []).flatMap((row) => [row.match_result_id, row.tournament_match_id].filter(Boolean)));
  }
  const tournamentById = new Map((tournaments || []).map((item) => [item.id, item]));
  return {
    tournaments: (tournaments || []).map((tournament) => ({ ...tournament, display_status: deriveTournamentDisplayStatus(tournament), subscribed: tournamentSubscribed.has(tournament.id) })),
    matches: (matches || []).map((match) => {
      const result = resultByMatch.get(match.id) || null;
      return { ...match, display_status: deriveMatchDisplayStatus(match), tournament: tournamentById.get(match.tournament_id), result, subscribed: subscribed.has(match.id) || (result ? subscribed.has(result.id) : false) };
    }),
  };
}

export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { data: recipients, error } = await supabaseAdmin.from('notification_recipients').select('notification_id').eq('user_id', userId);
  if (error || !recipients?.length) return 0;
  const ids = recipients.map((row) => row.notification_id);
  const { data: reads } = await supabaseAdmin.from('notification_reads').select('notification_id').eq('user_id', userId).in('notification_id', ids);
  const read = new Set((reads || []).map((row) => row.notification_id));
  return ids.filter((id) => !read.has(id)).length;
}

export async function getNotificationSettings(userId) {
  if (!userId) return { match_results_enabled: true };
  const { data, error } = await supabaseAdmin.from('notification_settings').select(NOTIFICATION_SETTINGS_SELECT).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created } = await supabaseAdmin.from('notification_settings').insert({ user_id: userId }).select(NOTIFICATION_SETTINGS_SELECT).single();
  return created || { match_results_enabled: true };
}

export async function saveNotificationSettings(userId, settings) {
  const payload = { user_id: userId, match_results_enabled: settings.match_results_enabled !== false, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin.from('notification_settings').upsert(payload, { onConflict: 'user_id' }).select(NOTIFICATION_SETTINGS_SELECT).single();
  if (error) throw error;
  return data;
}

export async function registerFcmToken(userId, token) {
  const { data, error } = await supabaseAdmin.from('fcm_tokens').upsert({ user_id: userId, token, platform: 'web', updated_at: new Date().toISOString() }, { onConflict: 'token' }).select(FCM_TOKEN_SELECT).single();
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
      if (!OPEN_TOURNAMENT_STATUSES.has(tournamentStatus)) throw new Error('Match alerts can only be enabled for upcoming or live tournaments.');
      if (!OPEN_MATCH_STATUSES.has(matchStatus)) throw new Error('Match alerts can only be enabled for upcoming or live matches.');
      const { data, error } = await supabaseAdmin.from('match_notification_subscriptions').upsert({ user_id: userId, tournament_match_id: tournamentMatchId }, { onConflict: 'user_id,tournament_match_id' }).select(SUBSCRIPTION_SELECT).single();
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
    if (!OPEN_TOURNAMENT_STATUSES.has(tournamentStatus)) throw new Error('Match alerts can only be enabled for upcoming or live tournaments.');

    if (matchResult.source_type === 'tournament_match' && matchResult.source_id) {
      const { data: sourceMatch, error: sourceError } = await supabaseAdmin
        .from('tournament_matches')
        .select('status')
        .eq('id', matchResult.source_id)
        .maybeSingle();
      if (sourceError) throw sourceError;
      const matchStatus = String(sourceMatch?.status || '').toLowerCase();
      if (sourceMatch && !OPEN_MATCH_STATUSES.has(matchStatus)) throw new Error('Match alerts can only be enabled for upcoming or live matches.');
    }
    const { data, error } = await supabaseAdmin.from('match_notification_subscriptions').upsert({ user_id: userId, match_result_id: matchResultId }, { onConflict: 'user_id,match_result_id' }).select(SUBSCRIPTION_SELECT).single();
    if (error) throw error;
    return { subscribed: true, row: data };
  }
  let deleteQuery = supabaseAdmin.from('match_notification_subscriptions').delete().eq('user_id', userId);
  deleteQuery = tournamentMatchId && !matchResultId ? deleteQuery.eq('tournament_match_id', tournamentMatchId) : deleteQuery.eq('match_result_id', matchResultId);
  const { error } = await deleteQuery;
  if (error) throw error;
  return { subscribed: false };
}

export async function setTournamentNotificationSubscription(userId, tournamentId, subscribed) {
  if (!userId) throw new Error('Not authenticated');
  if (!tournamentId) throw new Error('tournament_id is required');
  if (subscribed) {
    const { data, error } = await supabaseAdmin
      .from('tournament_notification_subscriptions')
      .upsert({ user_id: userId, tournament_id: tournamentId }, { onConflict: 'user_id,tournament_id' })
      .select(SUBSCRIPTION_SELECT)
      .single();
    if (error) throw error;
    return { subscribed: true, row: data };
  }
  const { error } = await supabaseAdmin.from('tournament_notification_subscriptions').delete().eq('user_id', userId).eq('tournament_id', tournamentId);
  if (error) throw error;
  return { subscribed: false };
}

export async function markNotificationsRead(userId, ids) {
  if (!userId || !ids?.length) return { ok: true };
  const rows = ids.map((notification_id) => ({ notification_id, user_id: userId }));
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
  if (!payload.source_id) throw new Error('Select an existing live tournament match before finalizing a result.');
  const { data: sourceMatch, error } = await supabaseAdmin.from('tournament_matches')
    .select('id,tournament_id,status').eq('id', payload.source_id).eq('tournament_id', tournament.id).single();
  if (error || !sourceMatch) throw new Error('Selected tournament match was not found.');
  if (normalizeTrackerStatus(sourceMatch.status) !== 'live') throw new Error('A match result can only be saved while the selected match is live.');
  const existing = await upsertTournamentMatchState({ ...payload, tournament_id: tournament.id, status: 'finished' });
  return existing.match;
}


export async function createMatchResultAlert(payload) {
  const now = new Date().toISOString();
  const source_type = payload.source_type || 'tournament_match';
  const tournament_id = payload.tournament_id || null;
  const tournament = await getTournamentForMatchResult(tournament_id);
  const sourceMatch = await createTournamentMatchFromResult(tournament, payload);
  const source_id = sourceMatch.id;
  const resultPayload = {
    source_type, source_id, tournament_id, game_slug: tournament.game_slug || sourceMatch.game_slug || 'pubg-mobile', match_title: sourceMatch.title,
    winner_name: String(payload.winner_name || '').trim() || null, winner_ref_type: payload.winner_ref_type || 'custom', winner_ref_id: payload.winner_ref_id || null,
    mvp_name: String(payload.mvp_name || '').trim() || null, mvp_athlete_id: payload.mvp_athlete_id || null,
    placement_3_name: String(payload.placement_3_name || '').trim() || null, placement_4_name: String(payload.placement_4_name || '').trim() || null,
    finalized_at: payload.finalized_at || now, alerted_at: now,
  };
  let duplicate = false;
  let existingId = null;
  if (source_id) {
    const { data: existing } = await supabaseAdmin.from('match_results').select('id').eq('source_type', source_type).eq('source_id', source_id).maybeSingle();
    existingId = existing?.id || null;
  }
  const query = existingId
    ? supabaseAdmin.from('match_results').update(resultPayload).eq('id', existingId)
    : supabaseAdmin.from('match_results').insert(resultPayload);
  const { data: matchResult, error } = await query.select('*, tournament:tournaments(id,name,game_slug,status)').single();
  if (error) throw error;
  duplicate = Boolean(existingId);
  const resultParts = [matchResult.winner_name ? `${matchResult.winner_name} won` : 'Result finalized', matchResult.mvp_name ? `MVP: ${matchResult.mvp_name}` : null].filter(Boolean);
  const title = `${resultParts.join(' — ')} 🏆`;
  const message = `${matchResult.match_title} result finalized for ${matchResult.tournament?.name || 'the selected tournament'}.`;
  const url = `/gaming-alerts?alert=${matchResult.id}`;
  const notificationPayload = { type: 'match_result', match_result_id: matchResult.id, tournament_match_id: source_id, tournament_id: matchResult.tournament_id, game_slug: matchResult.game_slug, title, message, url, metadata: { winner_name: matchResult.winner_name, mvp_name: matchResult.mvp_name, placement_3_name: matchResult.placement_3_name, placement_4_name: matchResult.placement_4_name } };
  const notificationQuery = duplicate
    ? supabaseAdmin.from('notifications').update(notificationPayload).eq('match_result_id', matchResult.id).eq('type', 'match_result')
    : supabaseAdmin.from('notifications').insert(notificationPayload);
  const { data: notification, error: nerr } = await notificationQuery.select(NOTIFICATION_SELECT).single();
  if (nerr) throw nerr;
  let push = null;
  try {
    push = await deliverMatchAlert({ notification, title, body: message, url, matchResultId: matchResult.id, tournamentId: matchResult.tournament_id, tournamentMatchId: source_id, type: 'match_result' });
  } catch (error) {
    push = { sent: 0, attempted: 0, error: error.message };
    console.error('Gaming Alerts FCM dispatch failed after result save:', error);
  }
  return { duplicate, matchResult, notification, push };
}


async function createMatchLiveAlert({ tournament, match }) {
  const title = formatMatchNotificationTitle(match, tournament);
  const message = 'Match started.';
  const url = matchNotificationUrl(tournament.id, match.id);
  const { data: notification, error } = await supabaseAdmin.from('notifications').insert({
    type: 'match_live',
    tournament_match_id: match.id,
    tournament_id: tournament.id,
    game_slug: match.game_slug || tournament.game_slug,
    title,
    message,
    url,
    metadata: { tournament_match_id: match.id, match_title: match.title, event: message },
  }).select(NOTIFICATION_SELECT).single();
  if (error) throw error;
  const push = await deliverMatchAlert({ notification, title, body: message, url, tournamentId: tournament.id, tournamentMatchId: match.id, type: 'match_live' });
  return { notification, push };
}

export async function dispatchStartingSoonMatchAlerts(now = new Date()) {
  // The cron runs every minute. A two-minute window makes deployments and short
  // scheduler delays safe while the database uniqueness index makes it idempotent.
  const windowStart = new Date(now.getTime() + 4 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 6 * 60 * 1000).toISOString();
  const { data: matches, error } = await supabaseAdmin.from('tournament_matches')
    .select('id,tournament_id,title,game_slug,team_a,team_b,starts_at,tournament:tournaments(id,name,game_slug,status)')
    .in('status', ['scheduled', 'upcoming'])
    .gte('starts_at', windowStart).lt('starts_at', windowEnd);
  if (error) throw error;
  const deliveries = [];
  for (const match of matches || []) {
    const title = formatMatchNotificationTitle(match, match.tournament);
    const message = 'Match starting in 5 minutes.';
    const url = matchNotificationUrl(match.tournament_id, match.id);
    const { data: notification, error: notificationError } = await supabaseAdmin.from('notifications').insert({
      type: 'match_starting_soon', tournament_match_id: match.id, tournament_id: match.tournament_id,
      game_slug: match.game_slug || match.tournament?.game_slug, title, message, url,
      metadata: { tournament_match_id: match.id, match_title: match.title, event: 'starting_soon' },
    }).select(NOTIFICATION_SELECT).single();
    if (notificationError?.code === '23505') continue;
    if (notificationError) throw notificationError;
    let push;
    try {
      push = await deliverMatchAlert({ notification, title, body: message, url, tournamentId: match.tournament_id, tournamentMatchId: match.id, type: 'match_starting_soon' });
    } catch (deliveryError) {
      // The recipient rows were created before FCM dispatch. A push failure must
      // not turn a valid in-app notification into a failed cron execution.
      push = { sent: 0, attempted: 0, error: deliveryError.message };
      console.error('Gaming Alerts FCM dispatch failed for five-minute warning:', deliveryError);
    }
    deliveries.push({ matchId: match.id, notificationId: notification.id, push });
  }
  return { checkedAt: now.toISOString(), dispatched: deliveries.length, deliveries };
}

export async function createManualMatchUpdateNotification(payload) {
  const matchId = payload.tournament_match_id || payload.source_id;
  if (!matchId) throw new Error('tournament_match_id is required');
  const { data: match, error } = await supabaseAdmin
    .from('tournament_matches')
    .select('id,tournament_id,title,game_slug,team_a,team_b,tournament:tournaments(id,name,game_slug,status)')
    .eq('id', matchId)
    .single();
  if (error || !match) throw new Error('Tournament match not found.');
  const eventTitle = String(payload.title || payload.preset || 'Match update').trim();
  const title = formatMatchNotificationTitle(match, match.tournament);
  const message = String(payload.message || `${eventTitle}.`).trim();
  const url = matchNotificationUrl(match.tournament_id, match.id);
  const { data: notification, error: notificationError } = await supabaseAdmin.from('notifications').insert({
    type: 'match_update',
    tournament_match_id: match.id,
    tournament_id: match.tournament_id,
    game_slug: match.game_slug || match.tournament?.game_slug,
    title,
    message,
    url,
    metadata: { tournament_match_id: match.id, match_title: match.title, preset: payload.preset || eventTitle, event: message },
  }).select(NOTIFICATION_SELECT).single();
  if (notificationError) throw notificationError;
  let push = null;
  try {
    push = await deliverMatchAlert({ notification, title, body: message, url, tournamentId: match.tournament_id, tournamentMatchId: match.id, type: 'match_update' });
  } catch (error) {
    push = { sent: 0, attempted: 0, error: error.message };
    console.error('Gaming Alerts FCM dispatch failed after manual update:', error);
  }
  return { notification, push };
}

export async function deleteMatchResultAlert(matchResultId) {
  if (!matchResultId) throw new Error('match result id is required');
  const { data, error } = await supabaseAdmin.rpc('admin_delete_match_result_alert', { p_match_result_id: matchResultId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function getEligibleMatchAlertUserIds({ matchResultId, tournamentId, tournamentMatchId }) {
  const directFilters = [];
  if (matchResultId) directFilters.push(`match_result_id.eq.${matchResultId}`);
  if (tournamentMatchId) directFilters.push(`tournament_match_id.eq.${tournamentMatchId}`);
  const { data: directSubscriptions, error: directError } = directFilters.length
    ? await supabaseAdmin.from('match_notification_subscriptions').select('user_id').or(directFilters.join(','))
    : { data: [], error: null };
  if (directError) throw directError;
  const { data: tournamentSubscriptions, error: tournamentError } = tournamentId
    ? await supabaseAdmin.from('tournament_notification_subscriptions').select('user_id').eq('tournament_id', tournamentId)
    : { data: [], error: null };
  if (tournamentError) throw tournamentError;
  return Array.from(new Set([...(directSubscriptions || []), ...(tournamentSubscriptions || [])].map((row) => row.user_id)));
}

async function recordNotificationRecipients(notificationId, userIds) {
  if (!notificationId || !userIds.length) return;
  const { error } = await supabaseAdmin.from('notification_recipients')
    .upsert(userIds.map((user_id) => ({ notification_id: notificationId, user_id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
  if (error) throw error;
}

async function deliverMatchAlert({ notification, title, body, url, matchResultId, tournamentId, tournamentMatchId, type }) {
  const candidateUserIds = await getEligibleMatchAlertUserIds({ matchResultId, tournamentId, tournamentMatchId });
  const { data: settings, error } = candidateUserIds.length
    ? await supabaseAdmin.from('notification_settings').select('user_id,match_results_enabled').in('user_id', candidateUserIds)
    : { data: [], error: null };
  if (error) throw error;
  const disabled = new Set((settings || []).filter((row) => row.match_results_enabled === false).map((row) => row.user_id));
  const userIds = candidateUserIds.filter((userId) => !disabled.has(userId));
  await recordNotificationRecipients(notification.id, userIds);
  return sendFcmToEligibleUsers({ title, body, url, matchResultId, tournamentId, tournamentMatchId, type, userIds });
}

export async function sendFcmToEligibleUsers({ title, body, url, matchResultId, tournamentId, tournamentMatchId, type = 'match_result', userIds: recipientUserIds }) {
  const userIds = recipientUserIds || await getEligibleMatchAlertUserIds({ matchResultId, tournamentId, tournamentMatchId });
  if (!userIds.length) return { sent: 0, attempted: 0 };
  const account = readFirebaseServiceAccount();
  const { data: tokens } = await supabaseAdmin.from('fcm_tokens').select('token,user_id').in('user_id', userIds);
  const { data: settings } = await supabaseAdmin.from('notification_settings').select('user_id,match_results_enabled').in('user_id', userIds);
  const disabled = new Set((settings || []).filter((row) => row.match_results_enabled === false).map((row) => row.user_id));
  const eligible = (tokens || []).filter((row) => !disabled.has(row.user_id));
  const accessToken = await getFirebaseAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  const results = await Promise.all(eligible.map(async (row) => {
    const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token: row.token, notification: { title, body }, webpush: { notification: { title, body, icon: '/icons/fn-badge.svg', badge: '/icons/icon.svg', tag: tournamentMatchId || matchResultId || tournamentId || 'fn-gaming-alert', renotify: true, actions: tournamentMatchId || matchResultId ? [{ action: 'mute-match', title: 'Mute this match' }] : [] }, fcm_options: { link: url } }, data: { url, matchResultId: matchResultId || '', tournamentId: tournamentId || '', tournamentMatchId: tournamentMatchId || '', type } } }) });
    return { ok: res.ok, status: res.status, user_id: row.user_id };
  }));
  return { sent: results.filter((r) => r.ok).length, attempted: eligible.length };
}
