'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Select, SubmitBtn } from '@/components/admin/Field';

const EMPTY = {
  type: 'wager',
  ref_id: '',
  label: '',
  badge: 'HOT',
  priority: '0',
  is_active: true,
};

type FormState = typeof EMPTY;

export default function AdminFeaturedPage() {
  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm]       = useState<FormState>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/featured?all=1');
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
      type:      String(row.type     ?? 'wager'),
      ref_id:    String(row.ref_id   ?? ''),
      label:     String(row.label    ?? ''),
      badge:     String(row.badge    ?? 'HOT'),
      priority:  String(row.priority ?? '0'),
      is_active: Boolean(row.is_active),
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { ...form, priority: Number(form.priority) || 0 };
      const url = editing ? `/api/featured/${editing.id}` : '/api/featured';
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
    if (!confirm(`Delete featured item "${row.label}"?`)) return;
    await fetch(`/api/featured/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: Exclude<keyof FormState, 'is_active'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">
            What&apos;s Hot Now
          </h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {rows.length} featured item{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <AdminTable
        loading={loading}
        rows={rows}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No featured items — click Add Item"
        columns={[
          { key: 'label',    label: 'Label' },
          { key: 'type',     label: 'Type' },
          { key: 'badge',    label: 'Badge' },
          { key: 'priority', label: 'Priority' },
          {
            key: 'is_active',
            label: 'Active',
            render: (r) => (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.is_active
                    ? 'bg-fn-green/10 text-fn-green'
                    : 'bg-fn-muted/10 text-fn-muted'
                }`}
              >
                {r.is_active ? 'Active' : 'Hidden'}
              </span>
            ),
          },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Featured Item' : 'Add Featured Item'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Label" required>
            <Input
              value={form.label}
              onChange={f('label')}
              placeholder="e.g. Lagos Lions vs Abuja Storm — LIVE NOW"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} onChange={f('type')}>
                <option value="wager">Wager</option>
                <option value="match">Match</option>
                <option value="news">News</option>
                <option value="team">Team</option>
                <option value="athlete">Athlete</option>
              </Select>
            </Field>
            <Field label="Badge">
              <Input value={form.badge} onChange={f('badge')} placeholder="HOT / NEW / LIVE" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference ID">
              <Input
                value={form.ref_id}
                onChange={f('ref_id')}
                placeholder="UUID of the linked item"
              />
            </Field>
            <Field label="Priority (lower = first)">
              <Input
                type="number"
                min="0"
                value={form.priority}
                onChange={f('priority')}
                placeholder="0"
              />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-fn-green"
            />
            <label htmlFor="is_active" className="text-fn-muted text-xs cursor-pointer">
              Show on wager page
            </label>
          </div>
          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Item' : 'Add Item'} />
        </form>
      </AdminModal>
    </div>
  );
}
