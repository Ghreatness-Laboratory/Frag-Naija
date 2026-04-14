/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, DollarSign, Settings, Users, AlertCircle } from 'lucide-react';

type Tx = {
  id: string;
  user_id: string | null;
  reference: string;
  type: string;
  amount_paid: number;
  fee: number;
  amount_credited: number;
  status: string;
  note: string | null;
  created_at: string;
};

type PlatformSettings = {
  min_deposit_ngn: string;
  platform_fee_percent: string;
  deposits_enabled: string;
  usd_ngn_rate: string;
  max_payout_usd: string;
};

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeColor(type: string) {
  if (type === 'deposit' || type === 'credit') return 'text-fn-green';
  return 'text-fn-red';
}

function statusBadge(status: string) {
  const cls =
    status === 'completed' ? 'bg-fn-green/10 text-fn-green border-fn-green/20'
    : status === 'suspicious' ? 'bg-fn-red/10 text-fn-red border-fn-red/20'
    : 'bg-fn-yellow/10 text-fn-yellow border-fn-yellow/20';
  return (
    <span className={`text-[10px] border px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

export default function AdminFinancePage() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [count,        setCount]        = useState(0);
  const [settings,     setSettings]     = useState<PlatformSettings | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');

  // Settings edit state
  const [settingsForm, setSettingsForm] = useState<PlatformSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg,    setSettingsMsg]    = useState('');

  // Manual credit/debit state
  const [creditForm, setCreditForm]   = useState({ userId: '', amount: '', type: 'credit', note: '' });
  const [creditErr,  setCreditErr]    = useState('');
  const [creditOk,   setCreditOk]     = useState('');
  const [crediting,  setCrediting]    = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [txRes, settingsRes] = await Promise.all([
      fetch('/api/admin/transactions'),
      fetch('/api/admin/settings'),
    ]);
    if (txRes.ok) {
      const data = await txRes.json();
      setTransactions(data.data || []);
      setCount(data.count || 0);
    }
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setSettings(s);
      setSettingsForm(s);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.reference.toLowerCase().includes(q) ||
      (t.user_id ?? '').toLowerCase().includes(q) ||
      (t.note ?? '').toLowerCase().includes(q)
    );
  });

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    setSettingsMsg('');
    const res = await fetch('/api/admin/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(settingsForm),
    });
    setSavingSettings(false);
    setSettingsMsg(res.ok ? 'Settings saved.' : 'Failed to save settings.');
    if (res.ok) setSettings(settingsForm);
  }

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault();
    setCreditErr('');
    setCreditOk('');
    setCrediting(true);
    try {
      const res  = await fetch('/api/admin/transactions/credit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userId: creditForm.userId,
          amount: Number(creditForm.amount),
          type:   creditForm.type,
          note:   creditForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreditOk(`Done. New balance: ₦${Number(data.newBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      setCreditForm({ userId: '', amount: '', type: 'credit', note: '' });
      loadAll();
    } catch (err: any) {
      setCreditErr(err.message);
    } finally {
      setCrediting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fn-text tracking-widest uppercase">Finance</h1>
        <p className="text-fn-muted text-sm mt-1">Transactions, settings, and manual adjustments</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: transactions */}
        <div className="xl:col-span-2 space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
              <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Total Records</p>
              <p className="text-fn-text font-bold font-mono text-lg">{count.toLocaleString()}</p>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
              <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Loaded</p>
              <p className="text-fn-text font-bold font-mono text-lg">{transactions.length.toLocaleString()}</p>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
              <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Deposits</p>
              <p className="text-fn-green font-bold font-mono text-lg">
                {fmt(transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount_credited), 0))}
              </p>
            </div>
          </div>

          {/* Table toolbar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference or user ID…"
              className="flex-1 bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
            />
            <button
              onClick={loadAll}
              className="w-9 h-9 flex items-center justify-center border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 rounded transition-all"
            >
              <RefreshCw size={14} />
            </button>
            <a
              href="/api/admin/transactions/export"
              className="flex items-center gap-1.5 px-3 py-2 bg-fn-card border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 rounded text-xs uppercase tracking-wider transition-all"
            >
              <Download size={13} /> Export CSV
            </a>
          </div>

          {/* Transactions table */}
          <div className="bg-fn-card border border-fn-gborder rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-fn-gborder bg-fn-dark">
                  <tr>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Reference</th>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Paid</th>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Credited</th>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-fn-gborder">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="h-4 bg-fn-dark rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-fn-muted">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="border-b border-fn-gborder last:border-0 hover:bg-fn-dark transition-colors">
                        <td className={`px-4 py-3 font-bold uppercase tracking-wider ${typeColor(t.type)}`}>{t.type}</td>
                        <td className="px-4 py-3 text-fn-muted font-mono">{t.reference.slice(0, 20)}…</td>
                        <td className="px-4 py-3 text-fn-text font-mono">{fmt(t.amount_paid)}</td>
                        <td className={`px-4 py-3 font-mono font-bold ${typeColor(t.type)}`}>{fmt(Number(t.amount_credited))}</td>
                        <td className="px-4 py-3">{statusBadge(t.status)}</td>
                        <td className="px-4 py-3 text-fn-muted">
                          {new Date(t.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: settings + manual credit */}
        <div className="space-y-4">
          {/* Platform Settings */}
          <div className="bg-fn-card border border-fn-gborder rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-fn-green" />
              <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Platform Settings</h2>
            </div>

            {settingsForm ? (
              <form onSubmit={saveSettings} className="space-y-3 text-sm">
                <div>
                  <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Min Deposit (₦)</label>
                  <input
                    type="number"
                    value={settingsForm.min_deposit_ngn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, min_deposit_ngn: e.target.value })}
                    className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Platform Fee (%)</label>
                  <input
                    type="number"
                    value={settingsForm.platform_fee_percent}
                    onChange={(e) => setSettingsForm({ ...settingsForm, platform_fee_percent: e.target.value })}
                    className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">USD/NGN Rate</label>
                  <input
                    type="number"
                    value={settingsForm.usd_ngn_rate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, usd_ngn_rate: e.target.value })}
                    className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Max Payout (USD)</label>
                  <input
                    type="number"
                    value={settingsForm.max_payout_usd}
                    onChange={(e) => setSettingsForm({ ...settingsForm, max_payout_usd: e.target.value })}
                    className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.deposits_enabled === 'true'}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deposits_enabled: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4 accent-fn-green"
                    />
                    <span className="text-fn-text text-xs uppercase tracking-wider">Deposits enabled</span>
                  </label>
                </div>
                {settingsMsg && (
                  <p className={`text-xs ${settingsMsg.includes('saved') ? 'text-fn-green' : 'text-fn-red'}`}>{settingsMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-fn-green text-fn-black font-bold py-2 rounded text-xs uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                >
                  {savingSettings ? 'Saving…' : 'Save Settings'}
                </button>
              </form>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-fn-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Manual Credit / Debit */}
          <div className="bg-fn-card border border-fn-gborder rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-fn-yellow" />
              <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Manual Adjustment</h2>
            </div>

            <form onSubmit={handleCredit} className="space-y-3 text-sm">
              <div>
                <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">User ID</label>
                <input
                  type="text"
                  value={creditForm.userId}
                  onChange={(e) => setCreditForm({ ...creditForm, userId: e.target.value })}
                  className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm font-mono focus:outline-none focus:border-fn-green transition-colors"
                  placeholder="UUID from Supabase"
                  required
                />
              </div>
              <div>
                <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted text-sm">₦</span>
                  <input
                    type="number"
                    min="1"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                    className="w-full bg-fn-dark border border-fn-gborder rounded pl-8 pr-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Type</label>
                <select
                  value={creditForm.type}
                  onChange={(e) => setCreditForm({ ...creditForm, type: e.target.value })}
                  className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                >
                  <option value="credit">Credit (add funds)</option>
                  <option value="debit">Debit (remove funds)</option>
                </select>
              </div>
              <div>
                <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Reason (required)</label>
                <input
                  type="text"
                  value={creditForm.note}
                  onChange={(e) => setCreditForm({ ...creditForm, note: e.target.value })}
                  className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                  placeholder="e.g. Dispute resolution #123"
                  required
                />
              </div>

              {creditErr && (
                <div className="flex items-start gap-2 text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  {creditErr}
                </div>
              )}
              {creditOk && (
                <p className="text-fn-green text-xs bg-fn-green/10 border border-fn-green/20 rounded px-3 py-2">{creditOk}</p>
              )}

              <button
                type="submit"
                disabled={crediting}
                className="w-full bg-fn-yellow text-fn-black font-bold py-2 rounded text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {crediting ? 'Processing…' : `Apply ${creditForm.type === 'credit' ? 'Credit' : 'Debit'}`}
              </button>
            </form>
          </div>

          {/* Max payout info */}
          {settings && (
            <div className="bg-fn-dark border border-fn-gborder rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs uppercase tracking-widest">Effective Payout Cap</span>
              </div>
              <p className="text-fn-text font-bold font-mono">
                {fmt(Number(settings.max_payout_usd) * Number(settings.usd_ngn_rate))}
              </p>
              <p className="text-fn-muted text-[10px] mt-1">
                ${Number(settings.max_payout_usd).toLocaleString()} USD × ₦{Number(settings.usd_ngn_rate).toLocaleString()} / USD
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
