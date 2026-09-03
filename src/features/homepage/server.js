import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const HOMEPAGE_SETTINGS_SELECT = 'id,hero_eyebrow,hero_headline,hero_tagline,stat_players,stat_tournaments,stat_championships,stat_prize_pool,recruitment_headline,recruitment_body,recruitment_cta,popup_enabled,popup_image_url,popup_title,popup_body,popup_cta,popup_cta_link,featured_team_ids,featured_tournament_ids,show_athletes,show_teams,show_shop,updated_at';

export const DEFAULT_HOMEPAGE_SETTINGS = {
  hero_eyebrow: "NIGERIA'S PREMIER ESPORTS PLATFORM",
  hero_headline: 'The Complete Esports Ecosystem',
  hero_tagline: 'Bringing everything together in one place.',
  stat_players: '1,242+',
  stat_tournaments: '48',
  stat_championships: '12',
  stat_prize_pool: '₦17.2M',
  recruitment_headline: 'RECRUITMENT OPEN',
  recruitment_body: 'JOIN FRAG NAIJA AND GET RANKED IN THE OPEN TRIALS.',
  recruitment_cta: 'JOIN THE RANKS',
  popup_enabled: 'false', popup_image_url: '', popup_title: '', popup_body: '', popup_cta: '', popup_cta_link: '',
  featured_team_ids: '', featured_tournament_ids: '',
  show_athletes: 'true', show_teams: 'true', show_shop: 'true',
};

function popupIsEnabled(value) {
  return value === true || String(value ?? '').trim().toLowerCase() === 'true';
}

function optionalUrl(value, label) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
  } catch {
    throw new Error(`${label} must be a valid http(s) URL.`);
  }
  return url;
}

/** Keep the single homepage announcement complete before it can go live. */
export function validateHomepageSettings(settings = {}) {
  if (!popupIsEnabled(settings.popup_enabled)) return;
  const required = [
    ['popup_title', 'Announcement title'],
    ['popup_body', 'Announcement message'],
    ['popup_image_url', 'Announcement image URL'],
    ['popup_cta', 'Announcement CTA label'],
  ];
  for (const [key, label] of required) {
    if (!String(settings[key] ?? '').trim()) throw new Error(`${label} is required when the announcement is live.`);
  }
  optionalUrl(settings.popup_image_url, 'Announcement image URL');
  optionalUrl(settings.popup_cta_link, 'Announcement CTA link');
}

export async function getHomepageSettings() {
  const { data, error } = await supabaseAdmin.from('homepage_settings').select(HOMEPAGE_SETTINGS_SELECT).single();
  if (error || !data) {
    console.error('homepage_settings fetch failed:', error);
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
  return { ...DEFAULT_HOMEPAGE_SETTINGS, ...data };
}

export async function updateHomepageSettings(settings) {
  validateHomepageSettings(settings);
  const normalized = {
    ...settings,
    popup_image_url: optionalUrl(settings.popup_image_url, 'Announcement image URL'),
    popup_cta_link: optionalUrl(settings.popup_cta_link, 'Announcement CTA link'),
  };
  const { data: existing } = await supabaseAdmin.from('homepage_settings').select('id').single();
  const payload = { ...normalized, updated_at: new Date().toISOString() };
  if (existing?.id) {
    const { error } = await supabaseAdmin.from('homepage_settings').update(payload).eq('id', existing.id);
    if (error) throw new Error(`Failed to save homepage settings: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin.from('homepage_settings').insert(payload);
    if (error) throw new Error(`Failed to save homepage settings: ${error.message}`);
  }
}
