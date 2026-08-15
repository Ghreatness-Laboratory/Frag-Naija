/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { Field, Input, Select, Textarea, SubmitBtn } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';

const EMPTY = {
  name: '', region: '', wins: '', losses: '', bio: '', logo_url: '', game_slug: 'pubg-mobile',
  rank: '', strength: '0', achievements: '', organization_id: '',
};

type GalleryFormItem = { image_url: string; caption: string; sort_order: string; file?: File | null };

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
  const [organizations, setOrganizations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string, unknown> | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<GalleryFormItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(gameSlug === 'all' ? '/api/teams' : `/api/teams?game_slug=${gameSlug}`);
    if (res.ok) setRows(await res.json());
    const orgRes = await fetch('/api/organizations');
    if (orgRes.ok) setOrganizations(await orgRes.json());
    setLoading(false);
  }, [gameSlug]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setLogoFile(null);
    setGallery([]);
    setError('');
    setOpen(true);
  }

  async function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      name:         String(row.name     ?? ''),
      region:       String(row.region   ?? ''),
      game_slug:    String(row.game_slug ?? (gameSlug === 'all' ? 'pubg-mobile' : gameSlug)),
      wins:         String(row.wins     ?? ''),
      losses:       String(row.losses   ?? ''),
      bio:          String(row.bio      ?? ''),
      logo_url:     String(row.logo_url ?? ''),
      rank:         row.rank != null ? String(row.rank) : '',
      strength:     String(row.strength ?? '0'),
      achievements: toArr(row.achievements),
      organization_id: String(row.organization_id ?? ''),
    });
    setLogoFile(null);
    setGallery([]);
    setError('');
    setOpen(true);
    const res = await fetch(`/api/teams/${row.id}`, { cache: 'no-store' });
    if (res.ok) {
      const detail = await res.json();
      setGallery((detail.gallery ?? []).map((item: Record<string, unknown>, index: number) => ({
        image_url: String(item.image_url ?? ''),
        caption: String(item.caption ?? ''),
        sort_order: String(item.sort_order ?? index),
        file: null,
      })));
    }
  }

  async function uploadFile(file: File, bucket = 'teams'): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', bucket);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;
    return uploadFile(logoFile, 'teams');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const logoUrl = await uploadLogo();
      const galleryRows = await Promise.all(gallery.map(async (item, index) => ({
        image_url: item.file ? await uploadFile(item.file, 'teams') : item.image_url,
        caption: item.caption,
        sort_order: Number(item.sort_order) || index,
      })));
      const body = {
        name:     form.name,
        game_slug: form.game_slug || (gameSlug === 'all' ? 'pubg-mobile' : gameSlug),
        region:   form.region,
        bio:      form.bio,
        logo_url: logoUrl ?? form.logo_url,
        wins:     Number(form.wins)     || 0,
        losses:   Number(form.losses)   || 0,
        strength: Number(form.strength) || 0,
        rank:     form.rank !== '' ? Number(form.rank) : null,
        achievements: splitArr(form.achievements),
        organization_id: form.organization_id || null,
        gallery: galleryRows,
      };
      const url = editing ? `/api/teams/${editing.id}` : '/api/teams';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
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
    await fetch(`/api/teams/${row.id}`, { method: 'DELETE', credentials: 'include' });
    load();
  }

  const f =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const missingGameSlugCount = rows.filter((r) => !String(r.game_slug ?? '').trim()).length;
  const grouped = GAMES.map((game) => ({ game, rows: rows.filter((r) => String(r.game_slug ?? '') === game.slug) })).filter((group) => group.rows.length > 0);
  const filtered = gameSlug === 'all' ? rows : rows.filter(r => String(r.game_slug ?? '') === gameSlug);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Teams</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} team{filtered.length !== 1 ? 's' : ''}
            {activeGame ? ` — ${activeGame.name}` : ''}
            {missingGameSlugCount > 0 ? ` · ${missingGameSlugCount} missing game_slug` : ''}
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

      {gameSlug === 'all' && grouped.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {grouped.map(({ game, rows: groupRows }) => (
            <span key={game.slug} className="rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: `${game.colors.primary}40`, color: game.colors.primary }}>
              {game.shortName}: {groupRows.length}
            </span>
          ))}
        </div>
      )}

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
          { key: 'game_slug', label: 'Game' },
          { key: 'organization', label: 'Org', render: (r) => String((r.organization as { name?: string } | null)?.name ?? '—') },
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

          <Field label="Game">
            <Select value={form.game_slug} onChange={f('game_slug')}>
              {GAMES.map((game) => <option key={game.slug} value={game.slug}>{game.name}</option>)}
            </Select>
          </Field>

          <Field label="Organization">
            <Select value={form.organization_id} onChange={f('organization_id')}>
              <option value="">Independent / No organization</option>
              {organizations.map((org) => <option key={String(org.id)} value={String(org.id)}>{String(org.name)}</option>)}
            </Select>
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

          {(editing || open) && (
            <Field label="Gallery">
              <div className="space-y-3 rounded-sm border border-fn-gborder bg-fn-black/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-fn-muted">Upload multiple highlight photos, add captions, and set sort order.</p>
                  <button type="button" onClick={() => setGallery((items) => [...items, { image_url: '', caption: '', sort_order: String(items.length), file: null }])} className="fn-btn-outline px-2 py-1 text-[9px]">Add Image</button>
                </div>
                {gallery.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-sm border border-fn-gborder p-2 sm:grid-cols-[80px_1fr_auto]">
                    <div className="h-20 w-20 overflow-hidden rounded-sm border border-fn-gborder bg-fn-card">
                      {item.file ? <img src={URL.createObjectURL(item.file)} alt="" className="h-full w-full object-cover" /> : item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="space-y-2">
                      <Input type="file" accept="image/*" onChange={(e) => setGallery((items) => items.map((g, i) => i === index ? { ...g, file: e.target.files?.[0] ?? null } : g))} />
                      <Input value={item.image_url} onChange={(e) => setGallery((items) => items.map((g, i) => i === index ? { ...g, image_url: e.target.value } : g))} placeholder="Or paste image URL" />
                      <Input value={item.caption} onChange={(e) => setGallery((items) => items.map((g, i) => i === index ? { ...g, caption: e.target.value } : g))} placeholder="Optional caption" />
                    </div>
                    <div className="flex flex-row gap-2 sm:flex-col">
                      <input className="w-20 rounded border border-fn-gborder bg-fn-dark px-2 py-2 text-sm text-fn-text" type="number" value={item.sort_order} onChange={(e) => setGallery((items) => items.map((g, i) => i === index ? { ...g, sort_order: e.target.value } : g))} />
                      <button type="button" onClick={() => setGallery((items) => items.filter((_, i) => i !== index))} className="rounded border border-fn-red/30 px-2 py-1 text-[10px] text-fn-red">Delete</button>
                    </div>
                  </div>
                ))}
                {!gallery.length && <p className="text-xs text-fn-muted">No gallery images yet.</p>}
              </div>
            </Field>
          )}

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
