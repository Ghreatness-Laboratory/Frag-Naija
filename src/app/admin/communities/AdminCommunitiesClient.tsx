'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';
import AdminTable from '@/components/admin/AdminTable';
import { Field, Input, Select, Textarea, SubmitBtn } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';

type Row = { id: string; game_slug: string; tier: string; name: string; description: string | null; whatsapp_url: string | null; discord_url: string | null; status: string; sort_order: number };
const EMPTY = { game_slug: 'pubg-mobile', tier: 'Open', name: '', description: '', whatsapp_url: '', discord_url: '', status: 'Published', sort_order: '0' };

export default function AdminCommunitiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/communities?all=1', { cache: 'no-store' });
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  const f = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  function openAdd() { setEditing(null); setForm(EMPTY); setOpen(true); setError(''); }
  function openEdit(row: Row) { setEditing(row); setForm({ game_slug: row.game_slug, tier: row.tier, name: row.name, description: row.description ?? '', whatsapp_url: row.whatsapp_url ?? '', discord_url: row.discord_url ?? '', status: row.status, sort_order: String(row.sort_order ?? 0) }); setOpen(true); setError(''); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const url = editing ? `/api/communities/${editing.id}` : '/api/communities';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) setError((await res.json()).error || 'Save failed'); else { setOpen(false); await load(); }
    setSaving(false);
  }
  async function remove(row: Row) { if (!confirm(`Delete community "${row.name}"?`)) return; await fetch(`/api/communities/${row.id}`, { method: 'DELETE', credentials: 'include' }); await load(); }

  return <div className="p-8"><div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Communities</h1><p className="text-xs text-fn-muted">Manage open WhatsApp and Discord hubs by game and tier.</p></div><button onClick={openAdd} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black"><Plus size={14} /> Add Community</button></div><AdminTable loading={loading} rows={rows} onEdit={(row) => openEdit(row as Row)} onDelete={(row) => remove(row as Row)} emptyText="No communities yet" columns={[{ key: 'name', label: 'Name' }, { key: 'game_slug', label: 'Game' }, { key: 'tier', label: 'Tier' }, { key: 'status', label: 'Status' }, { key: 'links', label: 'Links', render: (r) => `${r.whatsapp_url ? 'WhatsApp ' : ''}${r.discord_url ? 'Discord' : ''}` || '—' }]} /><AdminModal title={editing ? 'Edit Community' : 'Add Community'} open={open} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-3"><Field label="Name" required><Input value={form.name} onChange={f('name')} required /></Field><div className="grid grid-cols-2 gap-3"><Field label="Game" required><Select value={form.game_slug} onChange={f('game_slug')}>{GAMES.map((game) => <option key={game.slug} value={game.slug}>{game.name}</option>)}</Select></Field><Field label="Tier / Division" required><Input value={form.tier} onChange={f('tier')} required placeholder="Open, Pro, Lagos, North…" /></Field></div><Field label="Description"><Textarea value={form.description} onChange={f('description')} /></Field><Field label="WhatsApp Group URL"><Input value={form.whatsapp_url} onChange={f('whatsapp_url')} placeholder="https://chat.whatsapp.com/..." /></Field><Field label="Discord Server URL"><Input value={form.discord_url} onChange={f('discord_url')} placeholder="https://discord.gg/..." /></Field><div className="grid grid-cols-2 gap-3"><Field label="Status"><Select value={form.status} onChange={f('status')}><option>Published</option><option>Draft</option></Select></Field><Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={f('sort_order')} /></Field></div>{error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}<SubmitBtn loading={saving} label={editing ? 'Update Community' : 'Add Community'} /></form></AdminModal></div>;
}
