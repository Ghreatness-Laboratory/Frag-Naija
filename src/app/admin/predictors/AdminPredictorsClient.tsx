'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { rank: '', tag: '', accuracy: '', weekly_earnings: '' };

export default function AdminPredictorsPage() {
  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/predictors');
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError('');
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      rank:            String(row.rank            ?? ''),
      tag:             String(row.tag             ?? ''),
      accuracy:        String(row.accuracy        ?? ''),
      weekly_earnings: String(row.weekly_earnings ?? ''),
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, rank: Number(form.rank) || 1 };
      const url = editing ? `/api/predictors/${editing.id}` : '/api/predictors';
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
    if (!confirm(`Delete predictor "${row.tag}"?`)) return;
    await fetch(`/api/predictors/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Elite Predictors</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {rows.length} predictor{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Predictor
        </button>
      </div>

      <AdminTable
        loading={loading}
        rows={rows}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No predictors yet — click Add Predictor"
        columns={[
          { key: 'rank',            label: '#' },
          { key: 'tag',             label: 'Tag / Name' },
          { key: 'accuracy',        label: 'Accuracy' },
          { key: 'weekly_earnings', label: 'Weekly Earnings' },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Predictor' : 'Add Predictor'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rank" required>
              <Input
                type="number"
                min="1"
                value={form.rank}
                onChange={f('rank')}
                placeholder="1"
                required
              />
            </Field>
            <Field label="Tag / Name" required>
              <Input value={form.tag} onChange={f('tag')} placeholder="PrideEsport" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Accuracy">
              <Input value={form.accuracy} onChange={f('accuracy')} placeholder="92%" />
            </Field>
            <Field label="Weekly Earnings">
              <Input
                value={form.weekly_earnings}
                onChange={f('weekly_earnings')}
                placeholder="+₦12,400"
              />
            </Field>
          </div>
          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Predictor' : 'Add Predictor'} />
        </form>
      </AdminModal>
    </div>
  );
}
