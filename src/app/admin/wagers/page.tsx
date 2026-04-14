'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Flame, CheckCircle } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { question: '', subtitle: '', yes_odds: '1.60', no_odds: '2.63', yes_price: '62', no_price: '38', closes_at: '' };

export default function AdminWagersPage() {
  const [rows, setRows]         = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string,unknown> | null>(null);
  const [settleId, setSettleId] = useState<string | null>(null);
  const [outcome, setOutcome]   = useState<'YES' | 'NO'>('YES');
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/wagers');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    const d = new Date(); d.setDate(d.getDate() + 7);
    setForm({ ...EMPTY, closes_at: d.toISOString().slice(0, 16) });
    setError(''); setOpen(true);
  }

  function openEdit(row: Record<string,unknown>) {
    setEditing(row);
    const closesAt = row.closes_at ? String(row.closes_at).slice(0, 16) : '';
    setForm({
      question:  String(row.question  ?? ''),
      subtitle:  String(row.subtitle  ?? ''),
      yes_odds:  String(row.yes_odds  ?? '1.60'),
      no_odds:   String(row.no_odds   ?? '2.63'),
      yes_price: String(row.yes_price ?? '62'),
      no_price:  String(row.no_price  ?? '38'),
      closes_at: closesAt,
    });
    setError(''); setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = {
        ...form,
        yes_odds:  Number(form.yes_odds),
        no_odds:   Number(form.no_odds),
        yes_price: Number(form.yes_price),
        no_price:  Number(form.no_price),
      };
      const url    = editing ? `/api/wagers/${editing.id}` : '/api/wagers';
      const method = editing ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleHot(row: Record<string,unknown>) {
    await fetch(`/api/wagers/${row.id}/hot`, { method: 'PATCH' });
    load();
  }

  async function handleSettle() {
    if (!settleId) return;
    setSaving(true);
    await fetch(`/api/wagers/${settleId}/settle`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome }) });
    setSaving(false); setSettleId(null); load();
  }

  async function handleDelete(row: Record<string,unknown>) {
    if (!confirm('Delete this wager? (Only works if no bets placed)')) return;
    const res = await fetch(`/api/wagers/${row.id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isActive = (r: Record<string,unknown>) => r.status === 'Active';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Wagers</h1>
          <p className="text-fn-muted text-xs mt-0.5">{rows.length} market{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors">
          <Plus className="w-4 h-4" /> Add Wager
        </button>
      </div>

      <AdminTable
        loading={loading} rows={rows} onEdit={openEdit} onDelete={handleDelete}
        emptyText="No wagers yet"
        extraActions={row => (
          <>
            <button
              onClick={() => toggleHot(row)}
              className={`p-1.5 rounded transition-colors ${row.hot ? 'text-fn-amber bg-fn-amber/10' : 'text-fn-muted hover:text-fn-amber hover:bg-fn-amber/10'}`}
              title={row.hot ? 'Remove Hot' : 'Mark Hot'}
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
            {isActive(row) && (
              <button
                onClick={() => { setSettleId(String(row.id)); setOutcome('YES'); }}
                className="p-1.5 rounded text-fn-muted hover:text-fn-green hover:bg-fn-green/10 transition-colors"
                title="Settle Wager"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
        columns={[
          { key: 'question',   label: 'Question',  render: r => <span className="max-w-xs truncate block">{String(r.question)}</span> },
          { key: 'yes_price',  label: 'Yes',        render: r => <span className="text-fn-green">₦{String(r.yes_price)}</span> },
          { key: 'no_price',   label: 'No',         render: r => <span className="text-fn-red">₦{String(r.no_price)}</span> },
          { key: 'pool_total', label: 'Pool',        render: r => `₦${Number(r.pool_total||0).toLocaleString()}` },
          { key: 'hot',        label: 'Hot',         render: r => r.hot ? <Flame className="w-4 h-4 text-fn-amber" /> : <span className="text-fn-muted text-xs">—</span> },
          { key: 'closes_at',  label: 'Closes',      render: r => new Date(String(r.closes_at)).toLocaleDateString() },
          { key: 'status',     label: 'Status',      render: r => {
            const c = r.status === 'Active' ? 'bg-fn-green/10 text-fn-green' : 'bg-fn-muted/10 text-fn-muted';
            return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{String(r.status)}</span>;
          }},
        ]}
      />

      {/* Add / Edit Wager Modal */}
      <AdminModal title={editing ? 'Edit Wager' : 'Add Wager'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Question" required>
            <Textarea value={form.question} onChange={f('question')} placeholder="Will X win the tournament?" required />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={f('subtitle')} placeholder="Short context line" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yes Price (0–100)"><Input type="number" min="1" max="99" value={form.yes_price} onChange={f('yes_price')} /></Field>
            <Field label="No Price (0–100)"><Input type="number" min="1" max="99" value={form.no_price}  onChange={f('no_price')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yes Odds (×)"><Input type="number" step="0.01" value={form.yes_odds} onChange={f('yes_odds')} /></Field>
            <Field label="No Odds (×)"><Input type="number" step="0.01" value={form.no_odds}  onChange={f('no_odds')} /></Field>
          </div>
          <Field label="Closes At" required>
            <Input type="datetime-local" value={form.closes_at} onChange={f('closes_at')} required />
          </Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Wager' : 'Create Wager'} />
        </form>
      </AdminModal>

      {/* Settle Modal */}
      <AdminModal title="Settle Wager" open={!!settleId} onClose={() => setSettleId(null)}>
        <div className="space-y-4">
          <p className="text-fn-muted text-sm">Select the winning outcome. All bets will be resolved and winners credited to their wallets.</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOutcome('YES')}
              className={`py-3 rounded border font-bold text-sm transition-colors ${outcome === 'YES' ? 'bg-fn-green/10 border-fn-green text-fn-green' : 'border-fn-gborder text-fn-muted hover:border-fn-green/40'}`}
            >YES Wins</button>
            <button
              onClick={() => setOutcome('NO')}
              className={`py-3 rounded border font-bold text-sm transition-colors ${outcome === 'NO' ? 'bg-fn-red/10 border-fn-red text-fn-red' : 'border-fn-gborder text-fn-muted hover:border-fn-red/40'}`}
            >NO Wins</button>
          </div>
          <button
            onClick={handleSettle}
            disabled={saving}
            className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
          >
            {saving ? 'Settling...' : `Confirm — ${outcome} Wins`}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
