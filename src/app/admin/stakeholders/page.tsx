/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { Handshake, Plus, Save, Trash2 } from 'lucide-react';
import BrandedLoader from '@/components/common/BrandedLoader';
import { Field, Input } from '@/components/admin/Field';

type Stakeholder = {
  id?: string;
  name: string;
  role: string;
  photo_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  twitch_url: string;
  website_url: string;
  sort_order: number | string;
  status: string;
};

const EMPTY_STAKEHOLDER: Stakeholder = {
  name: '', role: '', photo_url: '', twitter_url: '', instagram_url: '', linkedin_url: '',
  youtube_url: '', twitch_url: '', website_url: '', sort_order: 0, status: 'Published',
};

export default function AdminStakeholdersPage() {
  const [rows, setRows] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Stakeholder>(EMPTY_STAKEHOLDER);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/stakeholders?admin=1', { cache: 'no-store', credentials: 'include' });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const f = (key: keyof Stakeholder) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  function edit(row: Stakeholder) {
    setEditingId(row.id ?? null);
    setForm({ ...EMPTY_STAKEHOLDER, ...row });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/stakeholders', {
      method: editingId ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editingId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Stakeholder save failed'); return; }
    setRows((prev) => editingId ? prev.map((row) => row.id === editingId ? data : row) : [...prev, data]);
    setEditingId(null); setForm(EMPTY_STAKEHOLDER);
  }

  async function remove(id?: string) {
    if (!id || !confirm('Delete this stakeholder?')) return;
    const res = await fetch(`/api/stakeholders?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Stakeholder delete failed'); return; }
    setRows((prev) => prev.filter((row) => row.id !== id));
    if (editingId === id) { setEditingId(null); setForm(EMPTY_STAKEHOLDER); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><BrandedLoader label="Loading stakeholders" /></div>;

  return <div className="max-w-6xl p-8">
    <div className="mb-6 flex items-start justify-between gap-4"><div><p className="fn-label mb-2 flex items-center gap-2 text-fn-green"><Handshake size={12} /> STAKEHOLDERS</p><h1 className="text-2xl font-black uppercase tracking-widest text-fn-text">Stakeholder Management</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">Dedicated admin screen for the public Home and About stakeholder cards.</p></div><button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_STAKEHOLDER); }} className="inline-flex items-center gap-2 rounded-sm border border-fn-green/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-green"><Plus size={12} /> New</button></div>
    {error && <p className="mb-4 rounded-sm border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="grid content-start gap-2 md:grid-cols-2">{rows.map((row) => <article key={row.id} className="flex items-center justify-between gap-3 rounded-sm border border-fn-gborder bg-fn-card p-3"><button type="button" onClick={() => edit(row)} className="flex min-w-0 items-center gap-3 text-left">{row.photo_url ? <img src={row.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-sm border border-fn-gborder object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-fn-gborder text-fn-green"><Handshake size={16} /></span>}<span className="min-w-0"><span className="block truncate text-xs font-black uppercase tracking-widest text-fn-text">{row.name || 'Unnamed'}</span><span className="mt-1 block truncate text-[10px] text-fn-muted">{row.role || 'No role'} · {row.status}</span></span></button><button type="button" onClick={() => remove(row.id)} className="text-fn-muted hover:text-fn-red" aria-label={`Delete ${row.name}`}><Trash2 size={14} /></button></article>)}{!rows.length && <p className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No stakeholders yet.</p>}</section>
      <form onSubmit={save} className="grid content-start gap-3 rounded-sm border border-fn-gborder bg-fn-card p-5"><h2 className="text-lg font-black uppercase tracking-widest text-fn-text">{editingId ? 'Edit Stakeholder' : 'Add Stakeholder'}</h2><div className="grid gap-3 sm:grid-cols-2"><Field label="Name" required><Input value={form.name} onChange={f('name')} required /></Field><Field label="Role" required><Input value={form.role} onChange={f('role')} required /></Field><Field label="Photo URL"><Input value={form.photo_url ?? ''} onChange={f('photo_url')} placeholder="https://..." /></Field><Field label="Sort Order"><Input type="number" value={form.sort_order} onChange={f('sort_order')} /></Field><Field label="X / Twitter URL"><Input value={form.twitter_url ?? ''} onChange={f('twitter_url')} /></Field><Field label="Instagram URL"><Input value={form.instagram_url ?? ''} onChange={f('instagram_url')} /></Field><Field label="LinkedIn URL"><Input value={form.linkedin_url ?? ''} onChange={f('linkedin_url')} /></Field><Field label="Website URL"><Input value={form.website_url ?? ''} onChange={f('website_url')} /></Field><Field label="YouTube URL"><Input value={form.youtube_url ?? ''} onChange={f('youtube_url')} /></Field><Field label="Twitch URL"><Input value={form.twitch_url ?? ''} onChange={f('twitch_url')} /></Field></div><Field label="Status"><select value={form.status} onChange={f('status')} className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2 text-sm text-fn-text outline-none focus:border-fn-green"><option>Published</option><option>Draft</option></select></Field><button type="submit" disabled={saving} className="inline-flex w-fit items-center gap-2 rounded-sm bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60"><Save size={14} /> {saving ? 'Saving...' : editingId ? 'Update Stakeholder' : 'Add Stakeholder'}</button></form>
    </div>
  </div>;
}
