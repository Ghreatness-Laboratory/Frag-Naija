import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const TEAM_SELECT = 'id,name,logo_url,region,rank,points,gold_count,silver_count,bronze_count,kills,strength,game_slug,organization_id,created_at,updated_at,organization:organizations(id,name,logo_url)';
const TEAM_ATHLETE_SELECT = 'id,name,ign,known_name,team,role,photo_url,game_slug,status,overall_rating,attack,defense,survival,iq,clutch,kills,assists,damage,winrate,is_icon';
const TEAM_GALLERY_SELECT = 'id,team_id,image_url,caption,sort_order,created_at';

function withPowerRanks(teams) {
  return teams
    .sort((a, b) => {
      if (Number(b.points ?? 0) !== Number(a.points ?? 0)) return Number(b.points ?? 0) - Number(a.points ?? 0);
      if ((a.rank ?? null) != null && (b.rank ?? null) != null) return a.rank - b.rank;
      if ((a.rank ?? null) != null) return -1;
      if ((b.rank ?? null) != null) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((team, index) => ({ ...team, power_rank: index + 1 }));
}

export async function getTeams({ game_slug } = {}) {
  let query = supabaseAdmin
    .from('teams')
    .select(TEAM_SELECT)
    .order('rank', { ascending: true, nullsLast: true });

  if (game_slug) query = query.eq('game_slug', game_slug);

  const { data: teams, error } = await query;
  if (error) throw error;

  let athleteQuery = supabaseAdmin.from('athletes').select(TEAM_ATHLETE_SELECT);
  if (game_slug) athleteQuery = athleteQuery.eq('game_slug', game_slug);
  const { data: athletes, error: athletesError } = await athleteQuery;
  if (athletesError) throw athletesError;

  return withPowerRanks(teams.map((team) => ({
    ...team,
    players: athletes.filter((athlete) => athlete.team === team.name),
  })));
}

export async function getTeamById(id, game_slug = null) {
  let query = supabaseAdmin.from('teams').select(TEAM_SELECT).eq('id', id);
  
  if (game_slug) query = query.eq('game_slug', game_slug);
  
  const { data: team, error } = await query.single();
  if (error) throw error;

  let playersQuery = supabaseAdmin
    .from('athletes')
    .select(TEAM_ATHLETE_SELECT)
    .eq('team', team.name);
    
  if (game_slug) playersQuery = playersQuery.eq('game_slug', game_slug);
  
  const { data: players, error: playersError } = await playersQuery;
  if (playersError) throw playersError;

  const { data: gallery, error: galleryError } = await supabaseAdmin
    .from('team_gallery')
    .select(TEAM_GALLERY_SELECT)
    .eq('team_id', team.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (galleryError) throw galleryError;

  return { ...team, players, gallery: gallery ?? [] };
}

export async function createTeam(body) {
  const { data, error } = await supabaseAdmin.from('teams').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function updateTeam(id, body) {
  const { data, error } = await supabaseAdmin.from('teams').update(body).eq('id', id).select().single();
  if (error) throw error;

  return data;
}

export async function deleteTeam(id) {
  const { error } = await supabaseAdmin.from('teams').delete().eq('id', id);
  if (error) throw error;
}


export async function replaceTeamGallery(teamId, gallery = []) {
  const { error: deleteError } = await supabaseAdmin.from('team_gallery').delete().eq('team_id', teamId);
  if (deleteError) throw deleteError;

  const rows = (Array.isArray(gallery) ? gallery : [])
    .map((item, index) => ({
      team_id: teamId,
      image_url: String(item.image_url ?? '').trim(),
      caption: String(item.caption ?? '').trim() || null,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
    }))
    .filter((item) => item.image_url);

  if (!rows.length) return [];

  const { data, error } = await supabaseAdmin
    .from('team_gallery')
    .insert(rows)
    .select(TEAM_GALLERY_SELECT)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
