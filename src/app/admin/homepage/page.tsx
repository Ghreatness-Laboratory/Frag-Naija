'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Field, Input, Textarea } from '@/components/admin/Field';

type Settings = Record<string, string>;
const FIELDS = [
  ['hero_eyebrow', 'Hero eyebrow'], ['hero_headline', 'Hero headline'], ['hero_tagline', 'Hero supporting text'],
  ['stat_players', 'Players stat'], ['stat_tournaments', 'Tournaments stat'], ['stat_championships', 'Championships stat'], ['stat_prize_pool', 'Prize pool stat'],
  ['recruitment_headline', 'Recruitment headline'], ['recruitment_body', 'Recruitment body'], ['recruitment_cta', 'Recruitment CTA'],
  ['popup_title', 'Popup title'], ['popup_body', 'Popup body'], ['popup_cta', 'Popup CTA'],
  ['featured_athlete_ids', 'Featured athlete IDs (comma-separated)'], ['featured_team_ids', 'Featured team IDs (comma-separated)'], ['featured_tournament_ids', 'Featured tournament IDs (comma-separated)'],
] as const;

export default function AdminHomepagePage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/homepage-settings', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : {})).then(setSettings).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch('/api/homepage-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return <div className="max-w-4xl p-8"><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Homepage / General Dashboard</h1><p className="mt-1 text-xs text-fn-muted">Edit the neutral ALL GAMES landing page. Per-game pages should use their own game-scoped content.</p>{loading ? <p className="mt-6 text-xs text-fn-muted">Loading homepage settings…</p> : <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-sm border border-fn-gborder bg-fn-card p-5">{FIELDS.map(([key, label]) => <Field key={key} label={label}>{key.includes('body') || key.includes('tagline') ? <Textarea value={settings[key] ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.value }))} /> : <Input value={settings[key] ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.value }))} />}</Field>)}{error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}<button type="submit" disabled={saving} className="fn-btn inline-flex items-center gap-2"><Save size={14} />{saving ? 'Saving…' : 'Save Homepage'}</button></form>}</div>;
}
