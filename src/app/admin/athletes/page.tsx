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

// Keywords used to match rows to a game when no game column exists
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
  const haystack = [row.team, row.ign, row.name, row.role, row.bio]
    .map(v => String(v ?? '').toLowerCase()).join(' ');
  return keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

const EMPTY = {
  name: '', ign: '', team: '', role: '', status: 'Active', bio: '', photo_url: '',
  attack: '0', defense: '0', clutch: '0', survival: '0', iq: '0', aggression: '0',
  overall_rating: '0', perks: '', strengths: '', weaknesses: '',
};

function toArr(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  return String(val ?? '');
}
function splitArr(str: string): string[] {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function AthletesContent() {
  const searchParams = useSearchParams();
  const gameSlug     = searchParams.get('game') ?? 'all';
  const activeGame   = GAMES.find(g => g.slug === gameSlug);

  const [rows, setRows]         = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string, unknown> | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [ar, tr] = await Promise.all([fetch('/api/athletes'), fetch('/api/teams')]);
    if (ar.ok) setRows(await ar.json());
    const teamData = await tr.json();
    setTeams(Array.isArray(teamData) ? teamData : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setPhotoFile(null);
    setError('');
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      name:           String(row.name   ?? ''),
      ign:            String(row.ign    ?? ''),
      team:           String(row.team   ?? ''),
      role:           String(row.role   ?? ''),
      status:         String(row.status ?? 'Active'),
      bio:            String(row.bio    ?? ''),
      photo_url:      String(row.photo_url ?? ''),
      attack:         String(row.attack   ?? '0'),
      defense:        String(row.defense  ?? '0'),
      clutch:         String(row.clutch   ?? '0'),
      survival:       String(row.survival ?? '0'),
      iq:             String(row.iq       ?? '0'),
      aggression:     String(row.aggression ?? '0'),
      overall_rating: String(row.overall_rating ?? '0'),
      perks:      toArr(row.perks),
      strengths:  toArr(row.strengths),
      weaknesses: toArr(row.weaknesses),
    });
    setPhotoFile(null);
    setError('');
    setOpen(true);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append('file', photoFile);
    fd.append('bucket', 'athletes');
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
      const photoUrl = await uploadPhoto();
      const body = {
        name:           form.name,
        ign:            form.ign,
        team:           form.team,
        role:           form.role,
        status:         form.status,
        bio:            form.bio,
        photo_url:      photoUrl ?? form.photo_url,
        attack:         Number(form.attack)         || 0,
        defense:        Number(form.defense)        || 0,
        clutch:         Number(form.clutch)         || 0,
        survival:       Number(form.survival)       || 0,
        iq:             Number(form.iq)             || 0,
        aggression:     Number(form.aggression)     || 0,
        overall_rating: Number(form.overall_rating) || 0,
        perks:      splitArr(form.perks),
        strengths:  splitArr(form.strengths),
        weaknesses: splitArr(form.weaknesses),
      };
      const url = editing ? `/api/athletes/${editing.id}` : '/api/athletes';
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
    await fetch(`/api/athletes/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const filtered = gameSlug === 'all' ? rows : rows.filter(r => matchesGame(r, gameSlug));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Athletes</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} player{filtered.length !== 1 ? 's' : ''}
            {activeGame ? ` — ${activeGame.name}` : ''}
            {gameSlug !== 'all' && <span className="ml-2 text-fn-muted">(filtered by team name)</span>}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest transition-colors"
          style={{ background: activeGame?.colors.primary ?? '#00ff41' }}
        >
          <Plus className="w-4 h-4" /> Add Athlete
        </button>
      </div>

      <AdminGameFilter currentSlug={gameSlug} />

      <AdminTable
        loading={loading}
        rows={filtered}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No athletes yet — click Add Athlete"
        columns={[
          {
            key: 'photo_url',
            label: 'Photo',
            render: (r) =>
              r.photo_url ? (
                <img src={String(r.photo_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-fn-card2 border border-fn-gborder" />
              ),
          },
          { key: 'name',           label: 'Name' },
          { key: 'ign',            label: 'IGN' },
          { key: 'team',           label: 'Team' },
          { key: 'role',           label: 'Role' },
          { key: 'overall_rating', label: 'OVR' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'Active'
                    ? 'bg-fn-green/10 text-fn-green'
                    : 'bg-fn-muted/10 text-fn-muted'
                }`}
              >
                {String(r.status)}
              </span>
            ),
          },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Athlete' : 'Add Athlete'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <Input value={form.name} onChange={f('name')} placeholder="Firstname Lastname" required />
            </Field>
            <Field label="IGN" required>
              <Input value={form.ign} onChange={f('ign')} placeholder="In-game name" required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Team">
              <Select value={form.team} onChange={f('team')}>
                <option value="">Free Agent</option>
                {teams.map((t) => (
                  <option key={String(t.id)} value={String(t.name)}>
                    {String(t.name)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={f('role')} placeholder="IGL / Fragger / Support" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Free Agent">Free Agent</option>
              </Select>
            </Field>
            <Field label="Overall Rating (0–10)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.overall_rating}
                onChange={f('overall_rating')}
                placeholder="8.5"
              />
            </Field>
          </div>

          {/* Combat attributes */}
          <p className="text-fn-muted text-xs uppercase tracking-widest pt-1">
            Combat Attributes (0–100)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Attack">
              <Input type="number" min="0" max="100" value={form.attack} onChange={f('attack')} placeholder="0" />
            </Field>
            <Field label="Defense">
              <Input type="number" min="0" max="100" value={form.defense} onChange={f('defense')} placeholder="0" />
            </Field>
            <Field label="Clutch">
              <Input type="number" min="0" max="100" value={form.clutch} onChange={f('clutch')} placeholder="0" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Survival">
              <Input type="number" min="0" max="100" value={form.survival} onChange={f('survival')} placeholder="0" />
            </Field>
            <Field label="IQ">
              <Input type="number" min="0" max="100" value={form.iq} onChange={f('iq')} placeholder="0" />
            </Field>
            <Field label="Aggression">
              <Input type="number" min="0" max="100" value={form.aggression} onChange={f('aggression')} placeholder="0" />
            </Field>
          </div>

          {/* Perks / Strengths / Weaknesses */}
          <Field label="Perks (comma-separated)">
            <Textarea
              value={form.perks}
              onChange={f('perks')}
              placeholder="Clutch King, Entry Fragger, Economy IQ"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Strengths (comma-separated)">
              <Textarea
                value={form.strengths}
                onChange={f('strengths')}
                placeholder="Long-range accuracy, Map control"
              />
            </Field>
            <Field label="Weaknesses (comma-separated)">
              <Textarea
                value={form.weaknesses}
                onChange={f('weaknesses')}
                placeholder="Passive under pressure, Close-range"
              />
            </Field>
          </div>

          <Field label="Bio">
            <Textarea value={form.bio} onChange={f('bio')} placeholder="Player description..." />
          </Field>

          <Field label="Photo">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-fn-gborder rounded px-3 py-2 hover:border-fn-green/40 transition-colors">
                <Upload className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs">
                  {photoFile ? photoFile.name : 'Upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                value={form.photo_url}
                onChange={f('photo_url')}
                placeholder="Or paste image URL"
              />
            </div>
          </Field>

          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Athlete' : 'Add Athlete'} />
        </form>
      </AdminModal>
    </div>
  );
}

export default function AdminAthletesPage() {
  return <Suspense><AthletesContent /></Suspense>;
}
