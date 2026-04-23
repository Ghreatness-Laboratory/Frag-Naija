/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';

const GAME_KEYWORDS: Record<string, string[]> = {
  'pubg-mobile':    ['pubg', 'battleground'],
  'cod-mobile':     ['cod', 'duty'],
  'free-fire':      ['free fire', 'ff ', 'freefire', 'lions ff', 'apex', 'raiders', 'wolves', 'kings ff'],
  'ea-fc-26':       ['ea fc', 'fc 26', 'fifa'],
  'mortal-kombat':  ['mortal', 'kombat', ' mk'],
  'efootball':      ['efootball', 'pes', 'konami'],
  'mobile-legends': ['legends', 'mlbb', 'bang bang'],
};

function matchesGame(row: Record<string, unknown>, slug: string): boolean {
  const keywords = GAME_KEYWORDS[slug] ?? [];
  const haystack = [row.name, row.region, row.bio, row.achievements]
    .map(v => String(v ?? '').toLowerCase()).join(' ');
  return keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

const EMPTY = {
  name: '', region: '', wins: '', losses: '', bio: '', logo_url: '',
  rank: '', strength: '0', achievements: '',
};

function toArr(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  return String(val ?? '');
}

function splitArr(str: string): string[] {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function TeamsContent() {
  const searchParams = useSearchParams();
  const gameSlug     = searchParams.get('game') ?? 'all';
  const activeGame   = GAMES.find(g => g.slug === gameSlug);

  const [rows, setRows]         = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string, unknown> | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/teams');
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setLogoFile(null);
    setError('');
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      name:         String(row.name     ?? ''),
      region:       String(row.region   ?? ''),
      wins:         String(row.wins     ?? ''),
      losses:       String(row.losses   ?? ''),
      bio:          String(row.bio      ?? ''),
      logo_url:     String(row.logo_url ?? ''),
      rank:         row.rank != null ? String(row.rank) : '',
      strength:     String(row.strength ?? '0'),
      achievements: toArr(row.achievements),
    });
    setLogoFile(null);
    setError('');
    setOpen(true);
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;
    const fd = new FormData();
    fd.append('file', logoFile);
    fd.append('bucket', 'teams');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const logoUrl = await uploadLogo();
      const body = {
        name:     form.name,
        region:   form.region,
        bio:      form.bio,
        logo_url: logoUrl ?? form.logo_url,
        wins:     Number(form.wins)     || 0,
        losses:   Number(form.losses)   || 0,
        strength: Number(form.strength) || 0,
        rank:     form.rank !== '' ? Number(form.rank) : null,
        achievements: splitArr(form.achievements),
      };
      const url = editing ? `/api/teams/${editing.id}` : '/api/teams';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm(`Delete ${row.name}?`)) return;
    await fetch(`/api/teams/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const filtered = gameSlug === 'all' ? rows : rows.filter(r => matchesGame(r, gameSlug));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Teams</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} team{filtered.length !== 1 ? 's' : ''}
            {activeGame ? ` — ${activeGame.name}` : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest transition-colors"
          style={{ background: activeGame?.colors.primary ?? '#00ff41' }}
        >
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      <AdminGameFilter currentSlug={gameSlug} />

      <AdminTable
        loading={loading}
        rows={filtered}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No teams yet — click Add Team"
        columns={[
          {
            key: 'logo_url',
            label: 'Logo',
            render: (r) =>
              r.logo_url ? (
                <img src={String(r.logo_url)} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <div className="w-8 h-8 rounded bg-fn-card2 border border-fn-gborder" />
              ),
          },
          { key: 'name',     label: 'Name' },
          { key: 'region',   label: 'Region' },
          { key: 'rank',     label: 'Rank' },
          { key: 'wins',     label: 'W' },
          { key: 'losses',   label: 'L' },
          { key: 'strength', label: 'Str' },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Team' : 'Add Team'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Team Name" required>
            <Input
              value={form.name}
              onChange={f('name')}
              placeholder="e.g. Athlegame Esports"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Region">
              <Input value={form.region} onChange={f('region')} placeholder="Lagos / Abuja / South-South" />
            </Field>
            <Field label="Rank (Power Ranking)">
              <Input
                type="number"
                min="1"
                value={form.rank}
                onChange={f('rank')}
                placeholder="Leave blank for unranked"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Wins">
              <Input type="number" value={form.wins} onChange={f('wins')} placeholder="0" />
            </Field>
            <Field label="Losses">
              <Input type="number" value={form.losses} onChange={f('losses')} placeholder="0" />
            </Field>
            <Field label="Team Strength (0–100)">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.strength}
                onChange={f('strength')}
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Achievements (comma-separated)">
            <Textarea
              value={form.achievements}
              onChange={f('achievements')}
              placeholder="National Champions 2024, Regional Finalists, Top Scorers"
            />
          </Field>

          <Field label="Bio">
            <Textarea value={form.bio} onChange={f('bio')} placeholder="Team description..." />
          </Field>

          <Field label="Logo">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-fn-gborder rounded px-3 py-2 hover:border-fn-green/40 transition-colors">
                <Upload className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs">
                  {logoFile ? logoFile.name : 'Upload logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                value={form.logo_url}
                onChange={f('logo_url')}
                placeholder="Or paste logo URL"
              />
            </div>
          </Field>

          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Team' : 'Add Team'} />
        </form>
      </AdminModal>
    </div>
  );
}

export default function AdminTeamsPage() {
  return <Suspense><TeamsContent /></Suspense>;
}
