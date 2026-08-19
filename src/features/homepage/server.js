import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

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
  featured_athlete_ids: '', featured_team_ids: '', featured_tournament_ids: '',
  show_athletes: 'true', show_teams: 'true', show_shop: 'true',
};

export async function getHomepageSettings() {
  const { data, error } = await supabaseAdmin
    .from('homepage_settings')
    .select('key, value');
  
  if (error || !data) {
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
  
  // Pivot array of {key, value} rows into flat object
  const settings = Object.fromEntries(data.map(row => [row.key, row.value]));
  
  return { ...DEFAULT_HOMEPAGE_SETTINGS, ...settings };
}

export async function updateHomepageSettings(settings) {
  const entries = Object.entries(settings);
  const timestamp = new Date().toISOString();
  
  for (const [key, value] of entries) {
    // Skip keys that aren't valid homepage_settings keys
    if (!(key in DEFAULT_HOMEPAGE_SETTINGS)) {
      continue;
    }
    
    const payload = { key, value, updated_at: timestamp };
    
    // Upsert by key (onConflict handles insert vs update)
    const { error } = await supabaseAdmin
      .from('homepage_settings')
      .upsert(payload, { onConflict: 'key' });
    
    if (error) {
      throw new Error(`Failed to save ${key}: ${error.message}`);
    }
  }
}
