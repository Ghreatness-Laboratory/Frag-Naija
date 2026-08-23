import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const HOMEPAGE_SETTINGS_SELECT = 'id,hero_eyebrow,hero_headline,hero_tagline,stat_players,stat_tournaments,stat_championships,stat_prize_pool,recruitment_headline,recruitment_body,recruitment_cta,popup_title,popup_body,popup_cta,featured_team_ids,featured_tournament_ids,show_athletes,show_teams,show_shop,created_at,updated_at';

export const DEFAULT_HOMEPAGE_SETTINGS = {
  hero_eyebrow: "NIGERIA'S PREMIER ESPORTS PLATFORM",
  hero_headline: 'FRAG NAIJA',
  hero_tagline: "Nigeria's premier esports command platform. Scout top athletes, track teams, enter tournaments, and follow wagers across every supported game.",
  stat_players: '1,242+',
  stat_tournaments: '48',
  stat_championships: '12',
  stat_prize_pool: '₦17.2M',
  recruitment_headline: 'RECRUITMENT OPEN',
  recruitment_body: 'JOIN FRAG NAIJA AND GET RANKED IN THE OPEN TRIALS.',
  recruitment_cta: 'JOIN THE RANKS',
  popup_title: '', popup_body: '', popup_cta: '',
  featured_team_ids: '', featured_tournament_ids: '',
  show_athletes: 'true', show_teams: 'true', show_shop: 'true',
};

export async function getHomepageSettings() {
  const { data, error } = await supabaseAdmin.from('homepage_settings').select(HOMEPAGE_SETTINGS_SELECT).single();
  if (error || !data) {
    console.error('homepage_settings fetch failed:', error);
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
  return { ...DEFAULT_HOMEPAGE_SETTINGS, ...data };
}

export async function updateHomepageSettings(settings) {
  const { data: existing } = await supabaseAdmin.from('homepage_settings').select('id').single();
  const payload = { ...settings, updated_at: new Date().toISOString() };

  if (existing?.id) {
    const { error } = await supabaseAdmin.from('homepage_settings').update(payload).eq('id', existing.id);
    if (error) throw new Error(`Failed to save homepage settings: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin.from('homepage_settings').insert(payload);
    if (error) throw new Error(`Failed to save homepage settings: ${error.message}`);
  }
}
