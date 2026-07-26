import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { assertValidGameSlug } from '@/lib/game-scope';

function computeOverallRating(athlete) {
  const attrs = ['attack', 'defense', 'clutch', 'survival', 'iq', 'aggression'];
  const values = attrs.map((k) => Number(athlete[k] ?? 0)).filter((v) => v > 0);
  if (!values.length) return Number(athlete.rating ?? 0);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export async function getAthletes({ team, status, gameSlug } = {}) {
  assertValidGameSlug(gameSlug);
  let query = supabaseAdmin.from('athletes').select('*').order('overall_rating', { ascending: false });

  query = query.eq('game_slug', gameSlug);
  if (team) query = query.eq('team', team);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  // Back-fill overall_rating if missing
  return (data || []).map((a) => ({
    ...a,
    overall_rating: a.overall_rating ?? computeOverallRating(a),
  }));
}

export async function getAthleteById(id, { gameSlug } = {}) {
  let query = supabaseAdmin.from('athletes').select('*').eq('id', id);
  if (gameSlug) {
    assertValidGameSlug(gameSlug);
    query = query.eq('game_slug', gameSlug);
  }
  const { data, error } = await query.single();
  if (error) throw error;

  return data;
}

export async function createAthlete(body) {
  assertValidGameSlug(body.game_slug);
  const { data, error } = await supabaseAdmin.from('athletes').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function updateAthlete(id, body) {
  if ('game_slug' in body) assertValidGameSlug(body.game_slug);
  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function deleteAthlete(id) {
  const { error } = await supabaseAdmin.from('athletes').delete().eq('id', id);
  if (error) throw error;
}
