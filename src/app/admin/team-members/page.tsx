'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';
import AdminTable from '@/components/admin/AdminTable';
import { Field, Input, Select, Textarea, SubmitBtn } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';
import OptimizedImage from '@/components/common/OptimizedImage';

type Row = Record<string, unknown> & { id: string; name: string; role: string };
const EMPTY = { name: '', role: '', bio: '', photo_url: '', currently_playing_game_slug: '', twitter_url: '', instagram_url: '', linkedin_url: '', twitch_url: '', youtube_url: '', sort_order: '0', status: 'Published' };

type Key = keyof typeof EMPTY;

export default function AdminTeamMembersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/team-members?all=1', { cache: 'no-store' });
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function add() { setEditing(null); setForm({ ...EMPTY, sort_order: String(rows.length) }); setPhotoFile(null); setError(''); setOpen(true); }
  function edit(row: Row) {
    setEditing(row);
    setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, String(row[key] ?? '')])) as typeof EMPTY);
    setPhotoFile(null); setError(''); setOpen(true);
  }
  async function remove(row: Row) { if (!confirm(`Delete ${row.name}?`)) return; await fetch(`/api/team-members/${row.id}`, { method: 'DELETE', credentials: 'include' }); load(); }
  const f = (key: Key) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function uploadPhoto() {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append('file', photoFile);
    fd.append('bucket', 'team-members');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url as string;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const photoUrl = await uploadPhoto();
      const url = editing ? `/api/team-members/${editing.id}` : '/api/team-members';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, photo_url: photoUrl ?? form.photo_url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setOpen(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  return <div className="p-8"><div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Team Members</h1><p className="text-xs text-fn-muted">Legacy creator profile records are no longer displayed publicly; use Company Profile for the company About page.</p></div><button onClick={add} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black"><Plus size={14} /> Add Member</button></div><AdminTable loading={loading} rows={rows} onEdit={(row) => edit(row as Row)} onDelete={(row) => remove(row as Row)} emptyText="No team members yet" columns={[{ key: 'photo_url', label: 'Photo', render: (r) => r.photo_url ? <OptimizedImage src={String(r.photo_url)} alt="" className="h-8 w-8 rounded-full object-cover" /> : '—' }, { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'currently_playing_game_slug', label: 'Playing' }, { key: 'sort_order', label: 'Order' }, { key: 'status', label: 'Status' }]} /><AdminModal title={editing ? 'Edit Team Member' : 'Add Team Member'} open={open} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-3"><div className="grid grid-cols-2 gap-3"><Field label="Name" required><Input value={form.name} onChange={f('name')} required /></Field><Field label="Role" required><Input value={form.role} onChange={f('role')} required /></Field></div><Field label="Bio"><Textarea value={form.bio} onChange={f('bio')} /></Field><Field label="Photo Upload"><Input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} /><p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">Uploaded file takes priority over URL.</p></Field><Field label="Photo URL"><Input value={form.photo_url} onChange={f('photo_url')} /></Field><div className="grid grid-cols-3 gap-3"><Field label="Currently Playing"><Select value={form.currently_playing_game_slug} onChange={f('currently_playing_game_slug')}><option value="">Not specified</option>{GAMES.map((game) => <option key={game.slug} value={game.slug}>{game.name}</option>)}</Select></Field><Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={f('sort_order')} /></Field><Field label="Status"><Select value={form.status} onChange={f('status')}><option>Published</option><option>Draft</option></Select></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Twitter / X URL"><Input value={form.twitter_url} onChange={f('twitter_url')} /></Field><Field label="Instagram URL"><Input value={form.instagram_url} onChange={f('instagram_url')} /></Field><Field label="LinkedIn URL"><Input value={form.linkedin_url} onChange={f('linkedin_url')} /></Field><Field label="Twitch URL"><Input value={form.twitch_url} onChange={f('twitch_url')} /></Field><Field label="YouTube URL"><Input value={form.youtube_url} onChange={f('youtube_url')} /></Field></div>{error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}<SubmitBtn loading={saving} label={editing ? 'Update Member' : 'Add Member'} /></form></AdminModal></div>;
}
