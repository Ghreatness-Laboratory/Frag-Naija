import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

function computeOverallRating(athlete) {
  const attrs = ['attack', 'defense', 'clutch', 'survival', 'iq', 'aggression'];
  const values = attrs.map((k) => Number(athlete[k] ?? 0)).filter((v) => v > 0);
  if (!values.length) return Number(athlete.rating ?? 0);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function normalizeAchievements(value) {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : (() => {
    try { return JSON.parse(String(value)); } catch { return []; }
  })();

  return (Array.isArray(raw) ? raw : [])
    .map((item) => ({
      title: String(item?.title ?? '').trim(),
      date: String(item?.date ?? '').trim(),
    }))
    .filter((item) => item.title || item.date);
}

function splitAthletePayload(body = {}) {
  const { achievements, ...athlete } = body;
  return { athlete, achievements: normalizeAchievements(achievements) };
}

async function getAchievementsForAthletes(ids) {
  if (!ids.length) return new Map();
  const { data, error } = await supabaseAdmin
    .from('achievements')
    .select('athlete_id, title, date')
    .in('athlete_id', ids)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data || []).reduce((map, row) => {
    const existing = map.get(row.athlete_id) || [];
    existing.push({ title: row.title, date: row.date });
    map.set(row.athlete_id, existing);
    return map;
  }, new Map());
}

async function replaceAthleteAchievements(athleteId, achievements) {
  const { error: deleteError } = await supabaseAdmin.from('achievements').delete().eq('athlete_id', athleteId);
  if (deleteError) throw deleteError;
  if (!achievements.length) return;

  const rows = achievements.map((achievement) => ({ ...achievement, athlete_id: athleteId }));
  const { error: insertError } = await supabaseAdmin.from('achievements').insert(rows);
  if (insertError) throw insertError;
}

export async function getAthletes({ team, status, game_slug } = {}) {
  let query = supabaseAdmin.from('athletes').select('*').order('overall_rating', { ascending: false });

  if (team) query = query.eq('team', team);
  if (status) query = query.eq('status', status);
  if (game_slug) query = query.eq('game_slug', game_slug);

  const { data, error } = await query;
  if (error) throw error;

  const achievementMap = await getAchievementsForAthletes((data || []).map((athlete) => athlete.id));

  // Back-fill overall_rating if missing
  return (data || []).map((a) => ({
    ...a,
    achievements: achievementMap.get(a.id) || [],
    overall_rating: a.overall_rating ?? computeOverallRating(a),
  }));
}

export async function getAthleteById(id) {
  const { data, error } = await supabaseAdmin.from('athletes').select('*').eq('id', id).single();
  if (error) throw error;

  const achievementMap = await getAchievementsForAthletes([id]);
  return { ...data, achievements: achievementMap.get(id) || [] };
}

export async function createAthlete(body) {
  const { athlete, achievements } = splitAthletePayload(body);
  const { data, error } = await supabaseAdmin.from('athletes').insert([athlete]).select().single();
  if (error) throw error;

  await replaceAthleteAchievements(data.id, achievements);
  return { ...data, achievements };
}

export async function updateAthlete(id, body) {
  const { athlete, achievements } = splitAthletePayload(body);
  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update(athlete)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  await replaceAthleteAchievements(id, achievements);
  return { ...data, achievements };
}

export async function deleteAthlete(id) {
  const { error } = await supabaseAdmin.from('athletes').delete().eq('id', id);
  if (error) throw error;
}
