'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ArrowUpCircle, Download } from 'lucide-react';

type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  amount_sent: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  paystack_transfer_code: string | null;
  paystack_reference: string | null;
  status: string;
  admin_note: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Pending:   'bg-fn-yellow/10 text-fn-yellow border-fn-yellow/30',
    Approved:  'bg-fn-green/10 text-fn-green border-fn-green/30',
    Completed: 'bg-fn-green/20 text-fn-green border-fn-green/40',
    Failed:    'bg-fn-red/10 text-fn-red border-fn-red/30',
    Cancelled: 'bg-fn-muted/10 text-fn-muted border-fn-gborder',
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest rounded-sm ${map[status] ?? 'bg-fn-muted/10 text-fn-muted border-fn-gborder'}`}>
      {status}
    </span>
  );
}

type FilterTab = 'All' | 'Pending' | 'Approved' | 'Completed' | 'Failed' | 'Cancelled';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterTab>('Pending');
  const [selected, setSelected]       = useState<Withdrawal | null>(null);
  const [actionNote, setActionNote]   = useState('');
  const [acting, setActing]           = useState(false);
  const [actionErr, setActionErr]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/withdrawals');
    if (res.ok) setWithdrawals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'All'
    ? withdrawals
    : withdrawals.filter((w) => w.status === filter);

  const counts = {
    Pending:   withdrawals.filter((w) => w.status === 'Pending').length,
    Approved:  withdrawals.filter((w) => w.status === 'Approved').length,
    Completed: withdrawals.filter((w) => w.status === 'Completed').length,
    Failed:    withdrawals.filter((w) => w.status === 'Failed').length,
    Cancelled: withdrawals.filter((w) => w.status === 'Cancelled').length,
  };

  async function doAction(action: string) {
    if (!selected) return;
    if (action === 'reject' && !actionNote.trim()) {
      setActionErr('Please enter a reason for rejection.');
      return;
    }
    setActing(true);
    setActionErr('');
    try {
      const res = await fetch(`/api/admin/withdrawals/${selected.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, note: actionNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected(null);
      setActionNote('');
      load();
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  const totalPending   = withdrawals.filter((w) => w.status === 'Pending').reduce((s, w) => s + Number(w.amount), 0);
  const totalCompleted = withdrawals.filter((w) => w.status === 'Completed').reduce((s, w) => s + Number(w.amount_sent), 0);

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fn-text tracking-widest uppercase">Withdrawals</h1>
          <p className="text-fn-muted text-sm mt-0.5">Review and process user withdrawal requests</p>
        </div>
        <button onClick={load} className="w-9 h-9 flex items-center justify-center border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 rounded transition-all">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
          <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Pending</p>
          <p className="text-fn-yellow font-bold font-mono text-lg">{counts.Pending}</p>
          <p className="text-fn-muted text-[10px] mt-0.5">{fmt(totalPending)} queued</p>
        </div>
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
          <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Approved</p>
          <p className="text-fn-green font-bold font-mono text-lg">{counts.Approved}</p>
        </div>
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
          <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Completed</p>
          <p className="text-fn-green font-bold font-mono text-lg">{counts.Completed}</p>
          <p className="text-fn-muted text-[10px] mt-0.5">{fmt(totalCompleted)} sent</p>
        </div>
        <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
          <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Failed</p>
          <p className="text-fn-red font-bold font-mono text-lg">{counts.Failed}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-fn-gborder">
        {(['All', 'Pending', 'Approved', 'Completed', 'Failed', 'Cancelled'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase border-b-2 -mb-px transition-all ${
              filter === tab ? 'border-fn-green text-fn-green' : 'border-transparent text-fn-muted hover:text-fn-text'
            }`}
          >
            {tab}
            {tab !== 'All' && counts[tab as keyof typeof counts] > 0 && (
              <span className="ml-1.5 bg-fn-green/20 text-fn-green text-[8px] px-1.5 py-0.5 rounded-full">
                {counts[tab as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-fn-card border border-fn-gborder rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead className="border-b border-fn-gborder bg-fn-dark">
              <tr>
                {['User ID', 'Amount', 'Fee', 'Will Receive', 'Bank', 'Account', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-fn-muted uppercase tracking-widest font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-fn-gborder">
                    <td colSpan={9} className="px-4 py-3"><div className="h-4 bg-fn-dark rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-fn-muted">
                    <ArrowUpCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="border-b border-fn-gborder last:border-0 hover:bg-fn-dark transition-colors">
                    <td className="px-4 py-3 text-fn-muted font-mono text-[10px]">{w.user_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-bold text-fn-text font-mono">{fmt(w.amount)}</td>
                    <td className="px-4 py-3 text-fn-red font-mono">−{fmt(w.fee)}</td>
                    <td className="px-4 py-3 text-fn-green font-bold font-mono">{fmt(w.amount_sent)}</td>
                    <td className="px-4 py-3 text-fn-text">{w.bank_name}</td>
                    <td className="px-4 py-3 text-fn-muted font-mono">
                      ****{w.account_number.slice(-4)}
                      <span className="block text-[9px] text-fn-muted">{w.account_name}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 text-fn-muted">
                      {new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(w); setActionNote(''); setActionErr(''); }}
                        className="text-fn-green hover:underline text-[10px] font-bold uppercase tracking-wider"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-fn-dark border border-fn-gborder rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-fn-text font-bold uppercase tracking-widest text-sm">Manage Withdrawal</h3>
              <button onClick={() => setSelected(null)} className="text-fn-muted hover:text-fn-text text-xl leading-none">×</button>
            </div>

            {/* Summary */}
            <div className="bg-fn-card border border-fn-gborder rounded p-4 space-y-2 text-sm font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-fn-muted">Amount</span>
                <span className="text-fn-text font-bold">{fmt(selected.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fn-muted">Fee (5%)</span>
                <span className="text-fn-red">−{fmt(selected.fee)}</span>
              </div>
              <div className="flex justify-between border-t border-fn-gborder pt-2">
                <span className="text-fn-muted">To send</span>
                <span className="text-fn-green font-bold">{fmt(selected.amount_sent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fn-muted">Bank</span>
                <span className="text-fn-text">{selected.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fn-muted">Account</span>
                <span className="text-fn-text">****{selected.account_number.slice(-4)} — {selected.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fn-muted">Status</span>
                {statusBadge(selected.status)}
              </div>
              {selected.admin_note && (
                <div className="border-t border-fn-gborder pt-2">
                  <span className="text-fn-muted text-[10px]">Note: {selected.admin_note}</span>
                </div>
              )}
            </div>

            {/* Note field */}
            <div className="mb-4">
              <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Note (required for rejection)</label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="e.g. Account details mismatch"
                className="w-full bg-fn-card border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
              />
            </div>

            {actionErr && (
              <div className="flex items-start gap-2 text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2 mb-4">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                {actionErr}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {selected.status === 'Pending' && (
                <>
                  <button
                    onClick={() => doAction('approve')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-fn-green text-fn-black font-bold px-4 py-2 rounded text-xs uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button
                    onClick={() => doAction('reject')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-fn-red/20 text-fn-red border border-fn-red/30 font-bold px-4 py-2 rounded text-xs uppercase tracking-widest hover:bg-fn-red/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} /> Reject & Refund
                  </button>
                </>
              )}
              {selected.status === 'Approved' && (
                <>
                  <button
                    onClick={() => doAction('complete')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-fn-green text-fn-black font-bold px-4 py-2 rounded text-xs uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={13} /> Mark Completed
                  </button>
                  <button
                    onClick={() => doAction('fail')}
                    disabled={acting}
                    className="flex items-center gap-1.5 bg-fn-red/20 text-fn-red border border-fn-red/30 font-bold px-4 py-2 rounded text-xs uppercase tracking-widest hover:bg-fn-red/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} /> Mark Failed & Refund
                  </button>
                </>
              )}
              {!['Pending', 'Approved'].includes(selected.status) && (
                <p className="text-fn-muted text-xs italic">No actions available for {selected.status} withdrawals.</p>
              )}
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-fn-muted text-xs hover:text-fn-text transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
