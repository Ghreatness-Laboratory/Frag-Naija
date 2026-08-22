import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const ORG_SELECT = 'id,name,logo_url,region,founded_year,founded_date,description,created_at,updated_at,achievements:organization_achievements(id,title,date,game_slug,description)';
const ORG_TEAM_SELECT = 'id,name,logo_url,region,game_slug,rank,wins,losses,kills,strength,organization_id';

function orderAchievements(org) {
  return {
    ...org,
    achievements: [...(org.achievements ?? [])].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? ''))),
  };
}

export async function getOrganizations() {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select(ORG_SELECT)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(orderAchievements);
}

export async function getOrganizationById(id) {
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select(ORG_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: teams, error: teamsError } = await supabaseAdmin
    .from('teams')
    .select(ORG_TEAM_SELECT)
    .eq('organization_id', id)
    .order('name', { ascending: true });
  if (teamsError) throw teamsError;

  return { ...orderAchievements(org), teams: teams ?? [] };
}

export async function createOrganization(body) {
  const { achievements = [], ...orgBody } = body;
  const { data, error } = await supabaseAdmin.from('organizations').insert([orgBody]).select().single();
  if (error) throw error;
  if (Array.isArray(achievements) && achievements.length) await replaceOrganizationAchievements(data.id, achievements);
  return getOrganizationById(data.id);
}

export async function updateOrganization(id, body) {
  const { achievements, ...orgBody } = body;
  const { error } = await supabaseAdmin.from('organizations').update(orgBody).eq('id', id);
  if (error) throw error;
  if (Array.isArray(achievements)) await replaceOrganizationAchievements(id, achievements);
  return getOrganizationById(id);
}

export async function deleteOrganization(id) {
  await supabaseAdmin.from('teams').update({ organization_id: null }).eq('organization_id', id);
  await supabaseAdmin.from('organization_achievements').delete().eq('organization_id', id);
  const { error } = await supabaseAdmin.from('organizations').delete().eq('id', id);
  if (error) throw error;
}

export async function replaceOrganizationAchievements(organizationId, achievements) {
  const { error: deleteError } = await supabaseAdmin
    .from('organization_achievements')
    .delete()
    .eq('organization_id', organizationId);
  if (deleteError) throw deleteError;

  const rows = achievements
    .filter((item) => item?.title)
    .map((item) => ({
      organization_id: organizationId,
      title: item.title,
      date: item.date || null,
      game_slug: item.game_slug || null,
      description: item.description || null,
    }));

  if (!rows.length) return [];
  const { data, error } = await supabaseAdmin.from('organization_achievements').insert(rows).select();
  if (error) throw error;
  return data;
}
