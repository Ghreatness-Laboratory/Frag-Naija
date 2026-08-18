import { NextResponse } from 'next/server';

import { checkAdmin } from '@/features/shared/server/adminAuth';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { createMatchResultAlert } from '@/features/notifications/server';

function badRequest(message, details = {}) {
  return NextResponse.json({ error: message, ...details }, { status: 400 });
}

function normalizeRow(row) {
  return {
    athlete_id: String(row.athlete_id || ''),
    participated: Boolean(row.participated),
    kills: row.kills === '' || row.kills === null || row.kills === undefined ? null : Number(row.kills),
    top_three_finish: Boolean(row.top_three_finish),
    match_win: Boolean(row.match_win),
    mvp: Boolean(row.mvp),
    finalized: Boolean(row.finalized),
  };
}

export async function POST(request, { params }) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  const matchId = params.id;
  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.rows) ? body.rows.map(normalizeRow) : [];
  const finalize = Boolean(body.finalize);

  if (!rows.length) return badRequest('Add at least one athlete before saving match stats.');

  const incompleteRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !row.athlete_id || !Number.isFinite(row.kills) || row.kills < 0);
  if (incompleteRows.length) {
    return badRequest('Every roster row must have an athlete and an explicit non-negative kill count.', {
      incompleteRows: incompleteRows.map(({ index }) => index),
    });
  }

  const mvpCount = rows.filter((row) => row.mvp).length;
  if (mvpCount > 1) return badRequest('Only one athlete can be marked MVP for a match.');

  const { data: match, error: matchError } = await supabaseAdmin
    .from('fantasy_matches')
    .select('id, gameweek_id, game_slug, title, team_a, team_b, status')
    .eq('id', matchId)
    .single();
  if (matchError || !match) return NextResponse.json({ error: 'Fantasy match not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const upserts = rows.map((row) => ({
    match_id: match.id,
    gameweek_id: match.gameweek_id,
    athlete_id: row.athlete_id,
    participated: row.participated,
    kills: row.kills,
    top_three_finish: row.top_three_finish,
    match_win: row.match_win,
    mvp: row.mvp,
    finalized: finalize,
    stats_last_edited_at: now,
  }));

  const { error: upsertError } = await supabaseAdmin
    .from('fantasy_match_stats')
    .upsert(upserts, { onConflict: 'match_id,athlete_id' });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  for (const row of upserts) {
    const { data: points, error: pointsError } = await supabaseAdmin.rpc('calculate_fantasy_match_points', {
      p_participated: row.participated,
      p_kills: row.kills,
      p_top_three_finish: row.top_three_finish,
      p_match_win: row.match_win,
      p_mvp: row.mvp,
    });
    if (pointsError) return NextResponse.json({ error: pointsError.message }, { status: 500 });
    const { error: updateError } = await supabaseAdmin
      .from('fantasy_match_stats')
      .update({ fantasy_points: points, stats_last_edited_at: now })
      .eq('match_id', match.id)
      .eq('athlete_id', row.athlete_id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabaseAdmin.rpc('refresh_fantasy_gameweek_points', { p_gameweek_id: match.gameweek_id });
  await supabaseAdmin
    .from('fantasy_matches')
    .update({ status: finalize ? 'finalized' : 'stats_entered', stats_last_edited_at: now, updated_at: now })
    .eq('id', match.id);

  const { data: savedRows } = await supabaseAdmin
    .from('fantasy_match_stats')
    .select('*, athletes(id, name, ign, known_name, team)')
    .eq('match_id', match.id)
    .order('created_at');

  let alert = null;
  if (finalize && match.status !== 'finalized') {
    const winnerRow = (savedRows || []).find((row) => row.match_win);
    const mvpRow = (savedRows || []).find((row) => row.mvp);
    if (winnerRow && mvpRow) {
      try {
        alert = await createMatchResultAlert({
          source_type: 'fantasy_match',
          source_id: match.id,
          game_slug: match.game_slug,
          match_title: match.title,
          winner_name: winnerRow.athletes?.team || winnerRow.athletes?.known_name || winnerRow.athletes?.ign || winnerRow.athletes?.name || 'Winner',
          winner_ref_type: winnerRow.athletes?.team ? 'team' : 'athlete',
          winner_ref_id: winnerRow.athlete_id,
          mvp_name: mvpRow.athletes?.known_name || mvpRow.athletes?.ign || mvpRow.athletes?.name || 'MVP',
          mvp_athlete_id: mvpRow.athlete_id,
          finalized_at: now,
        });
      } catch (error) {
        console.error('Fantasy stat save completed, but Gaming Alerts result linkage failed:', error);
        alert = { error: error.message };
      }
    }
  }

  return NextResponse.json({ rows: savedRows || [], stats_last_edited_at: now, alert });
}
