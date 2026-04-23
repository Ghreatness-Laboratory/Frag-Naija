/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Upload, Star } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { Field, Input, Select, SubmitBtn } from '@/components/admin/Field';
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
  const haystack = [row.title, row.player, row.team, row.category]
    .map(v => String(v ?? '').toLowerCase()).join(' ');
  return keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

const EMPTY = { title: '', player: '', team: '', category: 'Clutch', video_url: '', thumbnail: '', date: '', featured: 'false' };

function HighlightsContent() {
  const searchParams = useSearchParams();
  const gameSlug     = searchParams.get('game') ?? 'all';
  const activeGame   = GAMES.find(g => g.slug === gameSlug);

  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/highlights');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] });
    setThumbFile(null); setError(''); setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      title:     String(row.title     ?? ''),
      player:    String(row.player    ?? ''),
      team:      String(row.team      ?? ''),
      category:  String(row.category  ?? 'Clutch'),
      video_url: String(row.video_url ?? ''),
      thumbnail: String(row.thumbnail ?? ''),
      date:      String(row.date      ?? ''),
      featured:  row.featured ? 'true' : 'false',
    });
    setThumbFile(null); setError(''); setOpen(true);
  }

  async function uploadThumb(): Promise<string | null> {
    if (!thumbFile) return null;
    const fd = new FormData();
    fd.append('file', thumbFile);
    fd.append('bucket', 'highlights');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const thumbUrl = await uploadThumb();
      const body = { ...form, featured: form.featured === 'true', ...(thumbUrl && { thumbnail: thumbUrl }) };
      const url    = editing ? `/api/highlights/${editing.id}` : '/api/highlights';
      const method = editing ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    await fetch(`/api/highlights/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const filtered = gameSlug === 'all' ? rows : rows.filter(r => matchesGame(r, gameSlug));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Highlights</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} clip{filtered.length !== 1 ? 's' : ''}
            {activeGame ? ` — ${activeGame.name}` : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest transition-colors"
          style={{ background: activeGame?.colors.primary ?? '#00ff41' }}
        >
          <Plus className="w-4 h-4" /> Add Highlight
        </button>
      </div>

      <AdminGameFilter currentSlug={gameSlug} />

      <AdminTable
        loading={loading} rows={filtered} onEdit={openEdit} onDelete={handleDelete}
        emptyText="No highlights yet"
        columns={[
          { key: 'thumbnail', label: 'Thumb', render: r => r.thumbnail ? <img src={String(r.thumbnail)} alt="" className="w-14 h-8 rounded object-cover" /> : <div className="w-14 h-8 rounded bg-fn-card2 border border-fn-gborder" /> },
          { key: 'title',    label: 'Title',    render: r => <span className="max-w-[200px] truncate block">{String(r.title)}</span> },
          { key: 'player',   label: 'Player' },
          { key: 'category', label: 'Category', render: r => <span className="text-xs px-2 py-0.5 rounded-full bg-fn-green/10 text-fn-green">{String(r.category)}</span> },
          { key: 'featured', label: 'Featured', render: r => r.featured ? <Star className="w-4 h-4 text-fn-yellow fill-fn-yellow" /> : <span className="text-fn-muted text-xs">—</span> },
          { key: 'date',     label: 'Date' },
          { key: 'views',    label: 'Views', render: r => Number(r.views || 0).toLocaleString() },
        ]}
      />

      <AdminModal title={editing ? 'Edit Highlight' : 'Add Highlight'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Title" required>
            <Input value={form.title} onChange={f('title')} placeholder="Epic 1v4 Clutch — Apex" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Player"><Input value={form.player} onChange={f('player')} placeholder="Player name" /></Field>
            <Field label="Team"><Input value={form.team} onChange={f('team')} placeholder="Team name" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onChange={f('category')}>
                <option value="Clutch">Clutch</option>
                <option value="Squad Wipe">Squad Wipe</option>
                <option value="Solo vs Squad">Solo vs Squad</option>
                <option value="Commander Cam">Commander Cam</option>
                <option value="Tournament">Tournament</option>
              </Select>
            </Field>
            <Field label="Featured">
              <Select value={form.featured} onChange={f('featured')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
          </div>
          <Field label="Video URL (YouTube / direct)">
            <Input value={form.video_url} onChange={f('video_url')} placeholder="https://youtube.com/watch?v=..." />
          </Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={f('date')} /></Field>
          <Field label="Thumbnail">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-fn-gborder rounded px-3 py-2 hover:border-fn-green/40 transition-colors">
                <Upload className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs">{thumbFile ? thumbFile.name : editing && form.thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setThumbFile(e.target.files?.[0] ?? null)} />
              </label>
              {editing && form.thumbnail && !thumbFile && (
                <img src={form.thumbnail} alt="" className="h-16 rounded object-cover border border-fn-gborder" />
              )}
              <Input value={form.thumbnail} onChange={f('thumbnail')} placeholder="Or paste thumbnail URL" />
            </div>
          </Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Highlight' : 'Add Highlight'} />
        </form>
      </AdminModal>
    </div>
  );
}

export default function AdminHighlightsPage() {
  return <Suspense><HighlightsContent /></Suspense>;
}
