import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const COMPANY_PROFILE_SELECT = 'id,company_name,company_logo,eyebrow,headline,intro,mission,what_we_do,operating_model,owned_products,created_at,updated_at';

export const DEFAULT_COMPANY_PROFILE = {
  company_name: 'Ghreatness Laboratory',
  company_logo: '',
  eyebrow: 'Meet the Creators of FragNaija',
  headline: 'Meet the Creators of FragNaija',
  intro: 'The company building FragNaija as a Nigerian esports command platform for athletes, teams, events, wagers, and gaming culture.',
  mission: 'Build useful digital infrastructure that helps Nigerian gaming talent get discovered, organized, and rewarded.',
  what_we_do: 'Ghreatness Laboratory designs, ships, and operates gaming products, content systems, and community tools for the FragNaija ecosystem.',
  operating_model: 'We operate with product-led experimentation, editorial control from the admin backend, and data-driven iteration across every live feature.',
  owned_products: 'FragNaija is the flagship product, spanning athlete scouting, team rankings, tournaments, wagers, communities, shop, highlights, and transfer activity.',
};

const FIELDS = new Set([
  'company_name', 'company_logo', 'eyebrow', 'headline', 'intro',
  'mission', 'what_we_do', 'operating_model', 'owned_products',
]);

function payload(body = {}) {
  const row = {};
  for (const [key, value] of Object.entries(body)) {
    if (FIELDS.has(key)) row[key] = value === '' ? null : value;
  }
  row.updated_at = new Date().toISOString();
  return row;
}

export async function getCompanyProfile() {
  const { data, error } = await supabaseAdmin.from('company_profile').select(COMPANY_PROFILE_SELECT).single();
  if (error || !data) return DEFAULT_COMPANY_PROFILE;
  return { ...DEFAULT_COMPANY_PROFILE, ...data };
}

export async function updateCompanyProfile(body) {
  const { data: existing } = await supabaseAdmin.from('company_profile').select('id').single();
  const row = payload(body);

  if (existing?.id) {
    const { data, error } = await supabaseAdmin.from('company_profile').update(row).eq('id', existing.id).select().single();
    if (error) throw error;
    return { ...DEFAULT_COMPANY_PROFILE, ...data };
  }

  const { data, error } = await supabaseAdmin.from('company_profile').insert([row]).select().single();
  if (error) throw error;
  return { ...DEFAULT_COMPANY_PROFILE, ...data };
}
