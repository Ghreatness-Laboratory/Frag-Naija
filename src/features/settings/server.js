import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function getSettings() {
  const { data, error } = await supabaseAdmin.from('platform_settings').select('*');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.key, r.value]));
}

export async function getSetting(key) {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value ?? null;
}

export async function updateSetting(key, value) {
  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() });
  if (error) throw error;
  return { ok: true };
}
