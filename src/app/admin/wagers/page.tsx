'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Flame, CheckCircle, Trash2 } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';

type WagerOption = { label: string; odds: string };

const BINARY_EMPTY = {
  question: '', subtitle: '',
  yes_odds: '1.60', no_odds: '2.63',
  yes_price: '62', no_price: '38',
  closes_at: '',
  type: 'binary',
};

export default function AdminWagersPage() {
  const [rows, setRows]         = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string, unknown> | null>(null);
  const [settleId, setSettleId] = useState<string | null>(null);
  const [outcome, setOutcome]   = useState<string>('YES');
  const [form, setForm]         = useState({ ...BINARY_EMPTY });
  const [options, setOptions]   = useState<WagerOption[]>([]);
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
    setForm({ ...BINARY_EMPTY, closes_at: d.toISOString().slice(0, 16) });
    setOptions([]);
    setError(''); setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
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
      type:      String(row.type ?? 'binary'),
    });
    const rawOptions = row.options;
    if (Array.isArray(rawOptions)) {
      setOptions(rawOptions.map((o: unknown) => {
        const opt = o as Record<string, unknown>;
        return { label: String(opt.label ?? ''), odds: String(opt.odds ?? '1.00') };
      }));
    } else {
      setOptions([]);
    }
    setError(''); setOpen(true);
  }

  function addOption() {
    setOptions(prev => [...prev, { label: '', odds: '1.00' }]);
  }

  function removeOption(i: number) {
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateOption(i: number, field: keyof WagerOption, value: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');

    if (form.type === 'player_pick' && options.length < 2) {
      setError('Player Pick wagers need at least 2 options.');
      setSaving(false); return;
    }

    try {
      const body: Record<string, unknown> = {
        question:  form.question,
        subtitle:  form.subtitle,
        closes_at: form.closes_at,
        type:      form.type,
      };

      if (form.type === 'binary') {
        body.yes_odds  = Number(form.yes_odds);
        body.no_odds   = Number(form.no_odds);
        body.yes_price = Number(form.yes_price);
        body.no_price  = Number(form.no_price);
        body.options   = [];
      } else {
        body.options   = options.map(o => ({ label: o.label.trim(), odds: Number(o.odds) }));
        body.yes_odds  = 1;
        body.no_odds   = 1;
        body.yes_price = 50;
        body.no_price  = 50;
      }

      const url    = editing ? `/api/wagers/${editing.id}` : '/api/wagers';
      const method = editing ? 'PUT' : 'POST';
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function toggleHot(row: Record<string, unknown>) {
    await fetch(`/api/wagers/${row.id}/hot`, { method: 'PATCH' });
    load();
  }

  function openSettle(row: Record<string, unknown>) {
    setSettleId(String(row.id));
    const rowType = String(row.type ?? 'binary');
    if (rowType === 'player_pick') {
      const opts = Array.isArray(row.options) ? row.options as Array<{label: string}> : [];
      setOutcome(opts[0]?.label ?? '');
    } else {
      setOutcome('YES');
    }
  }

  async function handleSettle() {
    if (!settleId || !outcome) return;
    setSaving(true);
    await fetch(`/api/wagers/${settleId}/settle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    setSaving(false); setSettleId(null); load();
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm('Delete this wager? (Only works if no bets placed)')) return;
    const res = await fetch(`/api/wagers/${row.id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    load();
  }

  const f = (k: keyof typeof BINARY_EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const isActive     = (r: Record<string, unknown>) => r.status === 'Active';
  const settlingRow  = settleId ? rows.find(r => String(r.id) === settleId) : null;
  const settlingType = String(settlingRow?.type ?? 'binary');
  const settlingOpts = settlingType === 'player_pick'
    ? (Array.isArray(settlingRow?.options) ? settlingRow.options as Array<{label: string; odds: number}> : [])
    : [];

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
                onClick={() => openSettle(row)}
                className="p-1.5 rounded text-fn-muted hover:text-fn-green hover:bg-fn-green/10 transition-colors"
                title="Settle Wager"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
        columns={[
          { key: 'question', label: 'Question', render: r => (
            <div className="max-w-xs">
              <span className="truncate block">{String(r.question)}</span>
              {r.type === 'player_pick' && (
                <span className="text-[9px] bg-fn-yellow/10 text-fn-yellow border border-fn-yellow/20 px-1.5 py-0.5 rounded-sm uppercase tracking-widest mt-0.5 inline-block">
                  Player Pick
                </span>
              )}
            </div>
          )},
          { key: 'type',      label: 'Type',   render: r => r.type === 'player_pick'
              ? <span className="text-fn-yellow text-xs">Player Pick</span>
              : <span className="text-fn-green text-xs">Binary</span> },
          { key: 'pool_total', label: 'Pool',   render: r => `₦${Number(r.pool_total || 0).toLocaleString()}` },
          { key: 'hot',        label: 'Hot',    render: r => r.hot ? <Flame className="w-4 h-4 text-fn-amber" /> : <span className="text-fn-muted text-xs">—</span> },
          { key: 'closes_at',  label: 'Closes', render: r => new Date(String(r.closes_at)).toLocaleDateString() },
          { key: 'status',     label: 'Status', render: r => {
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

          {/* Type toggle */}
          <Field label="Wager Type">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setForm(p => ({ ...p, type: 'binary' })); setOptions([]); }}
                className={`py-2 rounded border text-xs font-bold uppercase tracking-wider transition-colors ${
                  form.type === 'binary'
                    ? 'bg-fn-green/10 border-fn-green text-fn-green'
                    : 'border-fn-gborder text-fn-muted hover:border-fn-green/30'
                }`}
              >
                Binary (YES / NO)
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, type: 'player_pick' }))}
                className={`py-2 rounded border text-xs font-bold uppercase tracking-wider transition-colors ${
                  form.type === 'player_pick'
                    ? 'bg-fn-yellow/10 border-fn-yellow text-fn-yellow'
                    : 'border-fn-gborder text-fn-muted hover:border-fn-yellow/30'
                }`}
              >
                Player Pick
              </button>
            </div>
          </Field>

          {/* Binary fields */}
          {form.type === 'binary' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Yes Price (0–100)"><Input type="number" min="1" max="99" value={form.yes_price} onChange={f('yes_price')} /></Field>
                <Field label="No Price (0–100)"><Input type="number" min="1" max="99" value={form.no_price}  onChange={f('no_price')} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Yes Odds (×)"><Input type="number" step="0.01" value={form.yes_odds} onChange={f('yes_odds')} /></Field>
                <Field label="No Odds (×)"><Input type="number" step="0.01" value={form.no_odds}  onChange={f('no_odds')} /></Field>
              </div>
            </>
          )}

          {/* Player pick option builder */}
          {form.type === 'player_pick' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-fn-muted text-[10px] uppercase tracking-widest">Players / Options</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-[10px] text-fn-green hover:text-fn-gdim uppercase tracking-widest"
                >
                  <Plus className="w-3 h-3" /> Add Player
                </button>
              </div>
              {options.length === 0 && (
                <p className="text-fn-muted text-[10px] text-center py-3 border border-dashed border-fn-gborder rounded">
                  Add at least 2 player options
                </p>
              )}
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => updateOption(i, 'label', e.target.value)}
                    placeholder="Player / Team name"
                    className="flex-1 bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-xs focus:outline-none focus:border-fn-green transition-colors"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-fn-muted text-[10px]">×</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={opt.odds}
                      onChange={e => updateOption(i, 'odds', e.target.value)}
                      className="w-20 bg-fn-dark border border-fn-gborder rounded px-2 py-2 text-fn-text text-xs focus:outline-none focus:border-fn-green transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-fn-muted hover:text-fn-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

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
          <p className="text-fn-muted text-sm">
            Select the winning outcome. All bets will be resolved and winners credited to their wallets.
          </p>

          {settlingType === 'player_pick' ? (
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {settlingOpts.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setOutcome(opt.label)}
                  className={`py-3 px-4 rounded border font-bold text-sm text-left transition-colors ${
                    outcome === opt.label
                      ? 'bg-fn-green/10 border-fn-green text-fn-green'
                      : 'border-fn-gborder text-fn-muted hover:border-fn-green/40'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="ml-2 text-[10px] opacity-70">{opt.odds}× odds</span>
                </button>
              ))}
            </div>
          ) : (
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
          )}

          <button
            onClick={handleSettle}
            disabled={saving || !outcome}
            className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
          >
            {saving ? 'Settling...' : `Confirm — ${outcome} Wins`}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
