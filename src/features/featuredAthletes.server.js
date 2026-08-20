import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

const ATHLETE_FIELDS = 'id,name,ign,role,known_name,team,jersey_number,rating,overall_rating,kills,assists,winrate,attack,defense,survival,iq,clutch,photo_url,status,game_slug,is_icon';
const FEATURED_SELECT = `id,athlete_id,sort_order,created_at,athlete:athletes(${ATHLETE_FIELDS})`;

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    athlete: row.athlete ? {
      ...row.athlete,
      overall_rating: calculateAthleteOverallRating(row.athlete, row.athlete.game_slug),
    } : null,
  };
}

export async function getFeaturedAthletes() {
  const { data, error } = await supabaseAdmin
    .from('featured_athletes')
    .select(FEATURED_SELECT)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalize);
}

export async function addFeaturedAthlete(athleteId) {
  const { data: current, error: currentError } = await supabaseAdmin
    .from('featured_athletes')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (currentError) throw currentError;
  const sort_order = Number(current?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabaseAdmin
    .from('featured_athletes')
    .insert([{ athlete_id: athleteId, sort_order }])
    .select(FEATURED_SELECT)
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function removeFeaturedAthlete(id) {
  const { error } = await supabaseAdmin.from('featured_athletes').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderFeaturedAthletes(ids) {
  const updates = ids.map((id, sort_order) => supabaseAdmin.from('featured_athletes').update({ sort_order }).eq('id', id));
  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  return getFeaturedAthletes();
}
