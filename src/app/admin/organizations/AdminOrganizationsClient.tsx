'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';
import OptimizedImage from '@/components/common/OptimizedImage';

const EMPTY = { name: '', logo_url: '', region: '', founded_year: '', founded_date: '', description: '', achievements: '' };

type OrgRow = Record<string, unknown> & { achievements?: Achievement[] };
type Achievement = { title: string; date?: string; game_slug?: string; description?: string };

function parseAchievements(value: string): Achievement[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title, date = '', game_slug = '', description = ''] = line.split('|').map((part) => part.trim());
    return { title, date, game_slug, description };
  });
}

function formatAchievements(value: unknown): string {
  return Array.isArray(value) ? value.map((item) => [item.title, item.date, item.game_slug, item.description].filter(Boolean).join(' | ')).join('\n') : '';
}

export default function AdminOrganizationsPage() {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/organizations', { cache: 'no-store' });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setError(''); setOpen(true); }
  function openEdit(row: OrgRow) {
    setEditing(row);
    setForm({
      name: String(row.name ?? ''),
      logo_url: String(row.logo_url ?? ''),
      region: String(row.region ?? ''),
      founded_year: row.founded_year != null ? String(row.founded_year) : '',
      founded_date: String(row.founded_date ?? ''),
      description: String(row.description ?? ''),
      achievements: formatAchievements(row.achievements),
    });
    setError(''); setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = {
        name: form.name,
        logo_url: form.logo_url || null,
        region: form.region || null,
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        founded_date: form.founded_date || null,
        description: form.description || null,
        achievements: parseAchievements(form.achievements),
      };
      const res = await fetch(editing ? `/api/organizations/${editing.id}` : '/api/organizations', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setOpen(false); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function remove(row: OrgRow) {
    if (!confirm(`Delete ${row.name}? Teams assigned to it will be unassigned.`)) return;
    await fetch(`/api/organizations/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return <div className="p-8"><div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Organizations</h1><p className="text-xs text-fn-muted">Organizations are global/multi-game; teams and achievements can carry game-specific context.</p></div><button onClick={openAdd} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black"><Plus size={14} /> Add Org</button></div><AdminTable loading={loading} rows={rows} onEdit={openEdit} onDelete={remove} emptyText="No organizations yet" columns={[{ key: 'logo_url', label: 'Logo', render: (r) => r.logo_url ? <OptimizedImage src={String(r.logo_url)} alt="" className="h-8 w-8 rounded object-cover" /> : <Building2 className="text-fn-muted" size={18} /> }, { key: 'name', label: 'Name' }, { key: 'region', label: 'Region' }, { key: 'founded_year', label: 'Founded' }, { key: 'achievements', label: 'Achievements', render: (r) => String((r.achievements as unknown[] | undefined)?.length ?? 0) }]} /><AdminModal title={editing ? 'Edit Organization' : 'Add Organization'} open={open} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-3"><Field label="Name" required><Input value={form.name} onChange={f('name')} required /></Field><div className="grid grid-cols-2 gap-3"><Field label="Region"><Input value={form.region} onChange={f('region')} /></Field><Field label="Founded Year"><Input type="number" value={form.founded_year} onChange={f('founded_year')} /></Field></div><Field label="Founding Date"><Input type="date" value={form.founded_date} onChange={f('founded_date')} /></Field><Field label="Logo URL"><Input value={form.logo_url} onChange={f('logo_url')} /></Field><Field label="Description / History"><Textarea value={form.description} onChange={f('description')} /></Field><Field label="Achievements (one per line: Title | Date | game_slug | Description)"><Textarea value={form.achievements} onChange={f('achievements')} /></Field>{error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}<SubmitBtn loading={saving} label={editing ? 'Update Organization' : 'Add Organization'} /></form></AdminModal></div>;
}
