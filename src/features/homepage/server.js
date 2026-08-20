import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const DEFAULT_HOMEPAGE_SETTINGS = {
  hero_eyebrow: "NIGERIA'S BIGGEST ESPORTS ECOSYSTEM",
  hero_headline: 'FRAG NAIJA',
  hero_tagline: "Nigeria's premier esports command platform. Scout top athletes, track teams, enter tournaments, and follow wagers across every supported game.",
  stat_players: '1,342+',
  stat_tournaments: '487',
  stat_championships: '213',
  stat_prize_pool: '₦87.2M',
  recruitment_headline: 'RECRUITMENT OPEN',
  recruitment_body: 'JOIN FRAG NAIJA AND GET RANKED IN THE OPEN TRIALS.',
  recruitment_cta: 'JOIN THE RANKS',
  popup_title: '', popup_body: '', popup_cta: '',
  featured_athlete_ids: '', featured_team_ids: '', featured_tournament_ids: '',
  show_athletes: 'true', show_teams: 'true', show_shop: 'true',
};

export async function getHomepageSettings() {
  const { data, error } = await supabaseAdmin.from('homepage_settings').select('key, value');
  if (error || !data) return DEFAULT_HOMEPAGE_SETTINGS;
  const settings = Object.fromEntries(data.map((row) => [row.key, row.value]));
  return { ...DEFAULT_HOMEPAGE_SETTINGS, ...settings };
}

export async function updateHomepageSettings(settings) {
  const entries = Object.entries(settings).filter(([key]) => key in DEFAULT_HOMEPAGE_SETTINGS);
  const timestamp = new Date().toISOString();
  const rows = entries.map(([key, value]) => ({ key, value: String(value ?? ''), updated_at: timestamp }));
  const { error } = await supabaseAdmin.from('homepage_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(`Failed to save homepage settings: ${error.message}`);
}
