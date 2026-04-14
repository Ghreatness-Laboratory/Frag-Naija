/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Upload } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { name: '', region: '', wins: '', losses: '', kills: '', bio: '', logo_url: '' };

export default function AdminTeamsPage() {
  const [rows, setRows]       = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string,unknown> | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/teams');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setLogoFile(null); setError(''); setOpen(true); }
  function openEdit(row: Record<string,unknown>) {
    setEditing(row);
    setForm({ name: String(row.name??''), region: String(row.region??''), wins: String(row.wins??''), losses: String(row.losses??''), kills: String(row.kills??''), bio: String(row.bio??''), logo_url: String(row.logo_url??'') });
    setLogoFile(null); setError(''); setOpen(true);
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
    setSaving(true); setError('');
    try {
      const logoUrl = await uploadLogo();
      const body = {
        ...form,
        wins:   Number(form.wins)   || 0,
        losses: Number(form.losses) || 0,
        kills:  Number(form.kills)  || 0,
        ...(logoUrl && { logo_url: logoUrl }),
      };
      const url = editing ? `/api/teams/${editing.id}` : '/api/teams';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(row: Record<string,unknown>) {
    if (!confirm(`Delete ${row.name}?`)) return;
    await fetch(`/api/teams/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Teams</h1>
          <p className="text-fn-muted text-xs mt-0.5">{rows.length} team{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors">
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      <AdminTable
        loading={loading} rows={rows} onEdit={openEdit} onDelete={handleDelete}
        emptyText="No teams yet — click Add Team"
        columns={[
          { key: 'logo_url', label: 'Logo', render: r => r.logo_url ? <img src={String(r.logo_url)} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-fn-card2 border border-fn-gborder" /> },
          { key: 'name',    label: 'Name' },
          { key: 'region',  label: 'Region' },
          { key: 'wins',    label: 'W' },
          { key: 'losses',  label: 'L' },
        ]}
      />

      <AdminModal title={editing ? 'Edit Team' : 'Add Team'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Team Name" required><Input value={form.name} onChange={f('name')} placeholder="e.g. Athlegame Esports" required /></Field>
          <Field label="Region"><Input value={form.region} onChange={f('region')} placeholder="Lagos / Abuja / South-South" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Wins"><Input type="number" value={form.wins} onChange={f('wins')} placeholder="0" /></Field>
            <Field label="Losses"><Input type="number" value={form.losses} onChange={f('losses')} placeholder="0" /></Field>
            <Field label="Total Kills"><Input type="number" value={form.kills} onChange={f('kills')} placeholder="0" /></Field>
          </div>
          <Field label="Bio"><Textarea value={form.bio} onChange={f('bio')} placeholder="Team description..." /></Field>
          <Field label="Logo">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-fn-gborder rounded px-3 py-2 hover:border-fn-green/40 transition-colors">
                <Upload className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs">{logoFile ? logoFile.name : 'Upload logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
              </label>
              <Input value={form.logo_url} onChange={f('logo_url')} placeholder="Or paste logo URL" />
            </div>
          </Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Team' : 'Add Team'} />
        </form>
      </AdminModal>
    </div>
  );
}
