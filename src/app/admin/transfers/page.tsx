'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Select, Textarea, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { from_team: '', to_team: '', fee: '', status: 'Rumour', date: '', notes: '', athlete_id: '' };

export default function AdminTransfersPage() {
  const [rows, setRows]           = useState<Record<string,unknown>[]>([]);
  const [athletes, setAthletes]   = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [tr, ar] = await Promise.all([fetch('/api/transfers'), fetch('/api/athletes')]);
    setRows(await tr.json());
    setAthletes(await ar.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ ...EMPTY, date: new Date().toISOString().split('T')[0] }); setError(''); setOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = { ...form, fee: form.fee ? Number(form.fee) : null };
      const res = await fetch('/api/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(row: Record<string,unknown>) {
    if (!confirm('Delete this transfer?')) return;
    await fetch(`/api/transfers/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const getAthleteName = (id: unknown) => {
    const a = athletes.find(a => a.id === id);
    return a ? String(a.name) : String(id ?? '—');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Transfers</h1>
          <p className="text-fn-muted text-xs mt-0.5">{rows.length} transfer{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors">
          <Plus className="w-4 h-4" /> Add Transfer
        </button>
      </div>

      <AdminTable
        loading={loading} rows={rows} onDelete={handleDelete}
        emptyText="No transfers yet"
        columns={[
          { key: 'athlete_id', label: 'Player', render: r => getAthleteName(r.athlete_id) },
          { key: 'from_team',  label: 'From' },
          { key: 'to_team',    label: 'To' },
          { key: 'fee',        label: 'Fee (₦)', render: r => r.fee ? `₦${Number(r.fee).toLocaleString()}` : '—' },
          { key: 'status',     label: 'Status', render: r => {
            const c = r.status === 'Confirmed' ? 'bg-fn-green/10 text-fn-green' : r.status === 'Rumour' ? 'bg-fn-yellow/10 text-fn-yellow' : 'bg-fn-muted/10 text-fn-muted';
            return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{String(r.status)}</span>;
          }},
          { key: 'date',       label: 'Date' },
        ]}
      />

      <AdminModal title="Add Transfer" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Player">
            <Select value={form.athlete_id} onChange={f('athlete_id')}>
              <option value="">Select player</option>
              {athletes.map(a => <option key={String(a.id)} value={String(a.id)}>{String(a.name)} ({String(a.ign)})</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From Team"><Input value={form.from_team} onChange={f('from_team')} placeholder="Previous team" /></Field>
            <Field label="To Team"><Input value={form.to_team} onChange={f('to_team')} placeholder="New team" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fee (₦)"><Input type="number" value={form.fee} onChange={f('fee')} placeholder="Optional" /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="Rumour">Rumour</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
              </Select>
            </Field>
          </div>
          <Field label="Date"><Input type="date" value={form.date} onChange={f('date')} /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={f('notes')} placeholder="Additional details..." /></Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label="Add Transfer" />
        </form>
      </AdminModal>
    </div>
  );
}
