import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

function applyCalculatedOverallRating(athlete) {
  return {
    ...athlete,
    overall_rating: calculateAthleteOverallRating(athlete, athlete.game_slug),
  };
}

const ATHLETE_FIELDS = new Set([
  'name',
  'ign',
  'team',
  'role',
  'rating',
  'overall_rating',
  'kills',
  'assists',
  'damage',
  'winrate',
  'attack',
  'defense',
  'survival',
  'iq',
  'clutch',
  'aggression',
  'photo_url',
  'status',
  'bio',
  'known_name',
  'previous_aliases',
  'previous_teams',
  'performance_history',
  'perks',
  'strengths',
  'weaknesses',
  'game_slug',
  'jersey_number',
  'sensitivity_settings',
  'control_code',
  'is_icon',
]);

function normalizeAchievements(value) {
  if (!value) return [];

  const raw = Array.isArray(value)
    ? value
    : (() => {
        try {
          const parsed = JSON.parse(String(value));
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return String(value)
            .split('\n')
            .map((line) => {
              const [title = '', date = ''] = line.split('|').map((part) => part.trim());
              return { title, date };
            });
        }
      })();

  return raw
    .map((item) => {
      if (typeof item === 'string') return { title: item.trim(), date: '' };
      if (!item || typeof item !== 'object') return { title: '', date: '' };
      return {
        title: String(item.title ?? '').trim(),
        date: String(item.date ?? '').trim(),
      };
    })
    .filter((item) => item.title || item.date);
}

export function splitAthletePayload(body = {}) {
  const athlete = {};

  for (const [key, value] of Object.entries(body)) {
    if (key !== 'achievements' && ATHLETE_FIELDS.has(key)) {
      athlete[key] = value;
    }
  }

  return {
    athlete,
    achievements: normalizeAchievements(body.achievements),
  };
}

async function getAchievementsForAthletes(athleteIds) {
  if (!athleteIds.length) return new Map();

  const { data, error } = await supabaseAdmin
    .from('achievements')
    .select('athlete_id,title,date')
    .in('athlete_id', athleteIds);

  if (error) throw error;

  return (data || []).reduce((map, achievement) => {
    const list = map.get(achievement.athlete_id) || [];
    list.push({ title: achievement.title, date: achievement.date });
    map.set(achievement.athlete_id, list);
    return map;
  }, new Map());
}

async function replaceAthleteAchievements(athleteId, achievements) {
  const { error: deleteError } = await supabaseAdmin
    .from('achievements')
    .delete()
    .eq('athlete_id', athleteId);
  if (deleteError) throw deleteError;

  const rows = normalizeAchievements(achievements).map((achievement) => ({
    athlete_id: athleteId,
    title: achievement.title,
    date: achievement.date,
  }));

  if (!rows.length) return;

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

  return (data || [])
    .map((a) => ({
      ...a,
      achievements: achievementMap.get(a.id) || [],
      overall_rating: calculateAthleteOverallRating(a, a.game_slug),
    }))
    .sort((a, b) => Number(b.overall_rating ?? -1) - Number(a.overall_rating ?? -1));
}

export async function getAthleteById(id) {
  const { data, error } = await supabaseAdmin.from('athletes').select('*').eq('id', id).single();
  if (error) throw error;

  const achievementMap = await getAchievementsForAthletes([id]);
  return {
    ...data,
    achievements: achievementMap.get(id) || [],
    overall_rating: calculateAthleteOverallRating(data, data.game_slug),
  };
}

export async function createAthlete(body) {
  const { athlete, achievements } = splitAthletePayload(body);
  const calculatedAthlete = applyCalculatedOverallRating(athlete);
  const { data, error } = await supabaseAdmin.from('athletes').insert([calculatedAthlete]).select().single();
  if (error) throw error;

  await replaceAthleteAchievements(data.id, achievements);
  return { ...data, achievements };
}

export async function updateAthlete(id, body) {
  const { athlete, achievements } = splitAthletePayload(body);
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single();
  if (existingError) throw existingError;

  const calculatedAthlete = applyCalculatedOverallRating({ ...existing, ...athlete });
  const { data, error } = await supabaseAdmin
    .from('athletes')
    .update(calculatedAthlete)
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
