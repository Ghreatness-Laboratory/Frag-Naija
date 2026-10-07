'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';
import BrandedLoader from '@/components/common/BrandedLoader';

type Settings = Record<string, string>;
type OptionRow = { id: string; ign?: string; name: string; game_slug?: string | null };
type TeamRow = { id: string; name: string; game_slug?: string | null };

const TEXT_FIELDS = [
  ['hero_eyebrow', 'Hero eyebrow'], ['hero_headline', 'Hero headline'], ['hero_tagline', 'Hero supporting text'],
  ['stat_players', 'Players stat'], ['stat_tournaments', 'Tournaments stat'], ['stat_championships', 'Championships stat'], ['stat_prize_pool', 'Prize pool stat'],
  ['recruitment_headline', 'Recruitment headline'], ['recruitment_body', 'Recruitment body'], ['recruitment_cta', 'Recruitment CTA'],
  ['show_athletes', 'Show athletes section (true/false)'], ['show_teams', 'Show teams section (true/false)'], ['show_shop', 'Show shop section (true/false)'], ['featured_tournament_ids', 'Featured tournament IDs (comma-separated)'],
] as const;

function parseIds(value: string | undefined) {
  return String(value ?? '').split(/[\n,]+/).map((id) => id.trim()).filter(Boolean);
}

function labelGame(slug?: string | null) {
  return GAMES.find((game) => game.slug === slug)?.shortName ?? slug ?? 'Game';
}

function FeaturedPicker({
  label,
  ids,
  options,
  onChange,
  emptyText,
}: {
  label: string;
  ids: string[];
  options: OptionRow[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  const available = options.filter((option) => !ids.includes(option.id));
  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);

  function add(id: string) {
    if (id) onChange([...ids, id]);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= ids.length) return;
    const next = [...ids];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  return (
    <Field label={label}>
      <div className="space-y-2 rounded border border-fn-gborder bg-fn-dark/30 p-3">
        <Select value="" onChange={(event) => add(event.target.value)}>
          <option value="">Add featured item…</option>
          {available.map((option) => (
            <option key={option.id} value={option.id}>{option.ign ? `${option.ign} — ${option.name}` : option.name} · {labelGame(option.game_slug)}</option>
          ))}
        </Select>
        {ids.length === 0 ? <p className="text-xs text-fn-muted">{emptyText}</p> : ids.map((id, index) => {
          const option = byId.get(id);
          return (
            <div key={`${id}-${index}`} className="flex flex-wrap items-center gap-2 rounded border border-fn-gborder bg-fn-card p-2 text-xs">
              <span className="min-w-0 flex-1 truncate font-bold text-fn-text">{option ? (option.ign ? `${option.ign} — ${option.name}` : option.name) : id}</span>
              <span className="fn-label">{labelGame(option?.game_slug)}</span>
              <button type="button" onClick={() => move(index, -1)} className="text-fn-muted hover:text-fn-green">Up</button>
              <button type="button" onClick={() => move(index, 1)} className="text-fn-muted hover:text-fn-green">Down</button>
              <button type="button" onClick={() => onChange(ids.filter((item) => item !== id))} className="text-fn-red">Remove</button>
            </div>
          );
        })}
      </div>
    </Field>
  );
}

export default function AdminHomepagePage() {
  const [settings, setSettings] = useState<Settings>({});
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/homepage-settings', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : {})).catch(() => ({})),
      fetch('/api/teams', { cache: 'no-store' }).then((res) => (res.ok ? res.json() : [])).catch(() => []),
    ]).then(([settingsData, teamRows]) => {
      setSettings(settingsData && !Array.isArray(settingsData) ? settingsData : {});
      setTeams(Array.isArray(teamRows) ? teamRows : []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const [homepageRes] = await Promise.all([
        fetch('/api/homepage-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        }),
      ]);
      const data = await homepageRes.json();
      if (!homepageRes.ok) throw new Error(data.error || 'Save failed');

      // Show success message
      setSuccess(data.message || 'Homepage settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const featuredTeamIds = parseIds(settings.featured_team_ids);

  return (
    <div className="max-w-4xl p-8">
      <h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Homepage / General Dashboard</h1>
      <p className="mt-1 text-xs text-fn-muted">Edit the neutral ALL GAMES landing page. Featured athletes are managed from the dedicated Featured Athletes admin page.</p>
      {loading ? (
        <div className="mt-6 flex justify-center">
          <BrandedLoader label="Loading homepage settings" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-sm border border-fn-gborder bg-fn-card p-5">
          <section className="rounded-xl border border-fn-green/30 bg-fn-black/40 p-4">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="fn-label text-fn-green">Homepage promotion</p><h2 className="font-display text-xl font-black uppercase text-fn-text">Announcement popup</h2></div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${settings.popup_enabled === 'true' ? 'border-fn-green/40 bg-fn-green/10 text-fn-green' : 'border-fn-gborder text-fn-muted'}`}>{settings.popup_enabled === 'true' ? 'Live' : 'Hidden'}</span>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-fn-muted">Only one announcement can be live. Enabling it requires a title, message, top image, and CTA; saving a changed announcement gives it a new dismissal identity for fresh sessions.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Announcement status"><Select value={settings.popup_enabled ?? 'false'} onChange={(event) => setSettings((prev) => ({ ...prev, popup_enabled: event.target.value }))}><option value="false">Hidden</option><option value="true">Live on homepage</option></Select></Field>
              <Field label="CTA label"><Input value={settings.popup_cta ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, popup_cta: event.target.value }))} placeholder="Explore now" /></Field>
              <div className="sm:col-span-2"><Field label="Announcement title"><Input value={settings.popup_title ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, popup_title: event.target.value }))} placeholder="Tournament registrations are open" /></Field></div>
              <div className="sm:col-span-2"><Field label="Announcement message"><Textarea value={settings.popup_body ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, popup_body: event.target.value }))} placeholder="Give players a concise reason to act." /></Field></div>
              <div className="sm:col-span-2"><Field label="Top image URL"><Input value={settings.popup_image_url ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, popup_image_url: event.target.value }))} placeholder="https://…" /></Field></div>
              <div className="sm:col-span-2"><Field label="CTA destination (optional)"><Input value={settings.popup_cta_link ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, popup_cta_link: event.target.value }))} placeholder="https://… or /tournaments" /></Field></div>
            </div>
          </section>
          <FeaturedPicker label="Featured Teams" ids={featuredTeamIds} options={teams} emptyText="No featured teams selected yet." onChange={(ids) => setSettings((prev) => ({ ...prev, featured_team_ids: ids.join(',') }))} />
          {TEXT_FIELDS.map(([key, label]) => (
            <Field key={key} label={label}>
              {key.includes('body') || key.includes('tagline') ? (
                <Textarea value={settings[key] ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.value }))} />
              ) : (
                <Input value={settings[key] ?? ''} onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.value }))} />
              )}
            </Field>
          ))}
          {error && (
            <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>
          )}
          {success && (
            <p className="rounded border border-fn-green/20 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">{success}</p>
          )}
          <button type="submit" disabled={saving} className="fn-btn inline-flex items-center gap-2">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Homepage'}
          </button>
        </form>
      )}
    </div>
  );
}
