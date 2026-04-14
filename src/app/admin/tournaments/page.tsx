'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Select, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { name: '', game: 'PUBG Mobile', prize_pool: '', currency: 'NGN', start_date: '', end_date: '', status: 'Upcoming', format: '', region: 'Nigeria', image_url: '' };

export default function AdminTournamentsPage() {
  const [rows, setRows]       = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string,unknown> | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tournaments');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setError(''); setOpen(true); }

  function openEdit(row: Record<string,unknown>) {
    setEditing(row);
    setForm({
      name:       String(row.name       ?? ''),
      game:       String(row.game       ?? 'PUBG Mobile'),
      prize_pool: String(row.prize_pool ?? ''),
      currency:   String(row.currency   ?? 'NGN'),
      start_date: String(row.start_date ?? ''),
      end_date:   String(row.end_date   ?? ''),
      status:     String(row.status     ?? 'Upcoming'),
      format:     String(row.format     ?? ''),
      region:     String(row.region     ?? 'Nigeria'),
      image_url:  String(row.image_url  ?? ''),
    });
    setError(''); setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = { ...form, prize_pool: Number(form.prize_pool) || 0 };
      const url    = editing ? `/api/tournaments/${editing.id}` : '/api/tournaments';
      const method = editing ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(row: Record<string,unknown>, status: string) {
    await fetch(`/api/tournaments/${row.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }

  async function handleDelete(row: Record<string,unknown>) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await fetch(`/api/tournaments/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Tournaments</h1>
          <p className="text-fn-muted text-xs mt-0.5">{rows.length} tournament{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors">
          <Plus className="w-4 h-4" /> Add Tournament
        </button>
      </div>

      <AdminTable
        loading={loading} rows={rows} onEdit={openEdit} onDelete={handleDelete}
        emptyText="No tournaments yet"
        extraActions={row => (
          <select
            value={String(row.status)}
            onChange={e => handleStatusChange(row, e.target.value)}
            className="text-xs bg-fn-dark border border-fn-gborder rounded px-2 py-1 text-fn-text focus:outline-none focus:border-fn-green"
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        )}
        columns={[
          { key: 'name',       label: 'Name' },
          { key: 'prize_pool', label: 'Prize',  render: r => `₦${Number(r.prize_pool||0).toLocaleString()}` },
          { key: 'start_date', label: 'Start' },
          { key: 'end_date',   label: 'End' },
          { key: 'status',     label: 'Status', render: r => {
            const c = r.status === 'Live' ? 'bg-fn-green/10 text-fn-green' : r.status === 'Upcoming' ? 'bg-fn-yellow/10 text-fn-yellow' : 'bg-fn-muted/10 text-fn-muted';
            return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{String(r.status)}</span>;
          }},
          { key: 'region', label: 'Region' },
        ]}
      />

      <AdminModal title={editing ? 'Edit Tournament' : 'Add Tournament'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Tournament Name" required>
            <Input value={form.name} onChange={f('name')} placeholder="e.g. Naija Pro League S2" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Game"><Input value={form.game} onChange={f('game')} /></Field>
            <Field label="Region"><Input value={form.region} onChange={f('region')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prize Pool (₦)"><Input type="number" value={form.prize_pool} onChange={f('prize_pool')} placeholder="500000" /></Field>
            <Field label="Currency">
              <Select value={form.currency} onChange={f('currency')}>
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date"><Input type="date" value={form.start_date} onChange={f('start_date')} /></Field>
            <Field label="End Date"><Input type="date" value={form.end_date} onChange={f('end_date')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format"><Input value={form.format} onChange={f('format')} placeholder="Battle Royale / TDMS" /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </Select>
            </Field>
          </div>
          <Field label="Image URL"><Input value={form.image_url} onChange={f('image_url')} placeholder="https://..." /></Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Tournament' : 'Add Tournament'} />
        </form>
      </AdminModal>
    </div>
  );
}
