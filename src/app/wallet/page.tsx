'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, TrendingUp,
  AlertCircle, CheckCircle, Building2, Pencil, X, Loader2,
} from 'lucide-react';

const DEPOSIT_FEE_PERCENT  = 10;
const WITHDRAW_FEE_PERCENT = 5;

// ── Types ────────────────────────────────────────────────────────────────────

type TxEntry = {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  reference: string;
};

type WalletData = {
  balance: number;
  total_won: number;
  total_lost: number;
};

type BankAccount = {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  paystack_recipient_code: string | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  fee: number;
  amount_sent: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

type Bank = { id: number; name: string; code: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeColor(type: string) {
  if (['deposit', 'credit', 'winnings', 'refund'].includes(type)) return 'text-fn-green';
  return 'text-fn-red';
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    deposit:  'Deposit',
    credit:   'Admin Credit',
    debit:    'Admin Debit',
    bet:      'Bet Placed',
    winnings: 'Winnings',
    refund:   'Refund',
  };
  return map[type] || type;
}

function statusBadge(status: string) {
  const cls =
    status === 'completed' || status === 'won' || status === 'refunded'
      ? 'bg-fn-green/10 text-fn-green border-fn-green/20'
      : status === 'lost'
      ? 'bg-fn-red/10 text-fn-red border-fn-red/20'
      : 'bg-fn-yellow/10 text-fn-yellow border-fn-yellow/20';
  return (
    <span className={`text-[10px] border px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

function wdStatusBadge(status: string) {
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

// ── BankAccountSection ───────────────────────────────────────────────────────

function BankAccountSection({
  bankAccount,
  onSaved,
}: {
  bankAccount: BankAccount | null;
  onSaved: (acct: BankAccount) => void;
}) {
  const [editing,   setEditing]   = useState(!bankAccount);
  const [banks,     setBanks]     = useState<Bank[]>([]);
  const [bankCode,  setBankCode]  = useState('');
  const [accNum,    setAccNum]    = useState('');
  const [accName,   setAccName]   = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState('');

  useEffect(() => {
    if (!editing) return;
    fetch('/api/banks')
      .then((r) => r.json())
      .then((d) => d.data && setBanks(d.data))
      .catch(() => {});
  }, [editing]);

  async function handleVerify() {
    setErr('');
    setAccName('');
    if (!bankCode || accNum.length !== 10) {
      setErr('Enter a valid 10-digit account number and select a bank.');
      return;
    }
    setVerifying(true);
    try {
      const res  = await fetch(`/api/bank-account/verify?account_number=${accNum}&bank_code=${bankCode}`);
      const data = await res.json();
      if (!res.ok || !data.data?.account_name) throw new Error(data.message || 'Could not verify account');
      setAccName(data.data.account_name);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function handleSave() {
    if (!accName) { setErr('Verify your account number first.'); return; }
    const bank = banks.find((b) => b.code === bankCode);
    if (!bank) { setErr('Select a bank.'); return; }
    setSaving(true);
    setErr('');
    try {
      const res  = await fetch('/api/bank-account', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bank_name: bank.name, bank_code: bankCode, account_number: accNum, account_name: accName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSaved(data);
      setEditing(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!editing && bankAccount) {
    return (
      <div className="bg-fn-card border border-fn-gborder rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-fn-green" />
            <span className="text-fn-text font-bold text-xs uppercase tracking-widest">Payout Account</span>
          </div>
          <button
            onClick={() => { setEditing(true); setBankCode(''); setAccNum(''); setAccName(''); setErr(''); }}
            className="text-fn-muted hover:text-fn-green text-[10px] flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <Pencil size={10} /> Change
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-fn-text font-bold text-sm">{bankAccount.account_name}</p>
            <p className="text-fn-muted text-[11px] mt-0.5">
              {bankAccount.bank_name} · ****{bankAccount.account_number.slice(-4)}
            </p>
          </div>
          <CheckCircle className="w-5 h-5 text-fn-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-fn-card border border-fn-gborder rounded-lg p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-fn-green" />
          <span className="text-fn-text font-bold text-xs uppercase tracking-widest">Set Payout Account</span>
        </div>
        {bankAccount && (
          <button onClick={() => setEditing(false)} className="text-fn-muted hover:text-fn-text">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Bank</label>
          <select
            value={bankCode}
            onChange={(e) => { setBankCode(e.target.value); setAccName(''); }}
            className="w-full bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
          >
            <option value="">Select bank...</option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-fn-muted text-[10px] uppercase tracking-widest mb-1">Account Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accNum}
              onChange={(e) => { setAccNum(e.target.value.replace(/\D/g, '')); setAccName(''); }}
              placeholder="0000000000"
              className="flex-1 bg-fn-dark border border-fn-gborder rounded px-3 py-2 text-fn-text text-sm font-mono focus:outline-none focus:border-fn-green transition-colors"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || accNum.length !== 10 || !bankCode}
              className="px-4 py-2 bg-fn-dark border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
            </button>
          </div>
        </div>

        {accName && (
          <div className="flex items-center gap-2 bg-fn-green/10 border border-fn-green/20 rounded px-3 py-2">
            <CheckCircle size={13} className="text-fn-green shrink-0" />
            <span className="text-fn-green text-xs font-bold">{accName}</span>
          </div>
        )}

        {err && (
          <div className="flex items-start gap-2 text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            {err}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !accName}
          className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-xs uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Account'}
        </button>
      </div>
    </div>
  );
}

// ── Main wallet content ───────────────────────────────────────────────────────

type Tab = 'deposit' | 'withdraw';

function WalletContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [wallet,      setWallet]      = useState<WalletData | null>(null);
  const [history,     setHistory]     = useState<TxEntry[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [authErr,     setAuthErr]     = useState(false);
  const [tab,         setTab]         = useState<Tab>('deposit');

  // Deposit state
  const [depAmount,   setDepAmount]   = useState('');
  const [paying,      setPaying]      = useState(false);
  const [payErr,      setPayErr]      = useState('');
  const [showSuccess, setShowSuccess] = useState(searchParams.get('status') === 'success');

  const depFee      = depAmount ? Math.round(Number(depAmount) * DEPOSIT_FEE_PERCENT) / 100 : 0;
  const depCredited = depAmount ? Number(depAmount) - depFee : 0;

  // Withdraw state
  const [wdAmount,   setWdAmount]   = useState('');
  const [wdBusy,     setWdBusy]     = useState(false);
  const [wdErr,      setWdErr]      = useState('');
  const [wdSuccess,  setWdSuccess]  = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const wdFee      = wdAmount ? Math.ceil(Number(wdAmount) * WITHDRAW_FEE_PERCENT) / 100 : 0;
  const wdNet      = wdAmount ? Number(wdAmount) - wdFee : 0;
  const hasPending = withdrawals.some((w) => w.status === 'Pending');

  const loadWithdrawals = useCallback(async () => {
    const res = await fetch('/api/withdraw');
    if (res.ok) setWithdrawals(await res.json());
  }, []);

  const loadBankAccount = useCallback(async () => {
    const res = await fetch('/api/bank-account');
    if (res.ok) {
      const data = await res.json();
      setBankAccount(data || null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/wallet');
    if (res.status === 401) { setAuthErr(true); setLoading(false); return; }
    if (res.ok) {
      const data = await res.json();
      setWallet(data.wallet);
      setHistory(data.history || []);
    }
    await Promise.all([loadWithdrawals(), loadBankAccount()]);
    setLoading(false);
  }, [loadWithdrawals, loadBankAccount]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => {
        setShowSuccess(false);
        router.replace('/wallet');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccess, router]);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setPayErr('');
    if (!depAmount || Number(depAmount) < 500) { setPayErr('Minimum deposit is ₦500'); return; }
    setPaying(true);
    try {
      const res  = await fetch('/api/deposit/pay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: Number(depAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialise payment');
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      setPayErr(err instanceof Error ? err.message : 'Payment error');
      setPaying(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWdErr('');
    setWdSuccess('');
    if (!wdAmount || Number(wdAmount) < 1000) { setWdErr('Minimum withdrawal is ₦1,000'); return; }
    setWdBusy(true);
    try {
      const res  = await fetch('/api/withdraw', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: Number(wdAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
      setWdSuccess('Withdrawal request submitted! Admin will review within 24 hours.');
      setWdAmount('');
      load();
    } catch (err: unknown) {
      setWdErr(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setWdBusy(false);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      const res  = await fetch(`/api/withdraw/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancel failed');
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not cancel');
    } finally {
      setCancelling(null);
    }
  }

  if (authErr) {
    return (
      <div className="min-h-screen bg-fn-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-fn-red mx-auto" />
          <p className="text-fn-text font-bold uppercase tracking-widest">Login required</p>
          <p className="text-fn-muted text-sm">You must be logged in to access your wallet.</p>
          <Link href="/login" className="fn-btn text-sm px-6 py-2 inline-block">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fn-black p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {showSuccess && (
        <div className="mb-6 flex items-center gap-3 bg-fn-green/10 border border-fn-green/30 rounded-lg p-4">
          <CheckCircle className="w-5 h-5 text-fn-green shrink-0" />
          <div>
            <p className="text-fn-green font-bold text-sm uppercase tracking-widest">Deposit successful!</p>
            <p className="text-fn-muted text-xs mt-0.5">Your wallet will be credited once Paystack confirms the payment.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6 text-fn-green" />
          <h1 className="text-2xl font-bold text-fn-text font-mono tracking-widest uppercase">Wallet</h1>
        </div>
        <p className="text-fn-muted text-sm">Manage your Frag Naija balance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
            <p className="text-fn-muted text-xs uppercase tracking-widest mb-1">Available Balance</p>
            {loading ? (
              <div className="h-9 w-32 bg-fn-dark rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-fn-green font-mono">{fmt(wallet?.balance ?? 0)}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
              <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Total Won</p>
              <p className="text-fn-green font-bold font-mono text-sm">{fmt(wallet?.total_won ?? 0)}</p>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-lg p-4">
              <p className="text-fn-muted text-[10px] uppercase tracking-widest mb-1">Total Lost</p>
              <p className="text-fn-red font-bold font-mono text-sm">{fmt(wallet?.total_lost ?? 0)}</p>
            </div>
          </div>

          <div className="bg-fn-dark border border-fn-gborder rounded-lg p-4 space-y-2">
            <p className="text-fn-muted text-[11px] leading-relaxed">
              <span className="text-fn-yellow font-bold">Deposit fee:</span> 10% platform fee on all deposits. Min ₦500.
            </p>
            <p className="text-fn-muted text-[11px] leading-relaxed">
              <span className="text-fn-yellow font-bold">Withdrawal fee:</span> 5% fee deducted from withdrawal amount. Min ₦1,000.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab switcher */}
          <div className="flex border-b border-fn-gborder">
            <button
              onClick={() => setTab('deposit')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-all ${
                tab === 'deposit' ? 'border-fn-green text-fn-green' : 'border-transparent text-fn-muted hover:text-fn-text'
              }`}
            >
              <ArrowDownCircle size={14} /> Deposit
            </button>
            <button
              onClick={() => setTab('withdraw')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-all ${
                tab === 'withdraw' ? 'border-fn-green text-fn-green' : 'border-transparent text-fn-muted hover:text-fn-text'
              }`}
            >
              <ArrowUpCircle size={14} /> Withdraw
            </button>
          </div>

          {/* ── DEPOSIT TAB ── */}
          {tab === 'deposit' && (
            <>
              <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ArrowDownCircle className="w-5 h-5 text-fn-green" />
                  <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Deposit Funds</h2>
                </div>

                <form onSubmit={handleDeposit} className="space-y-4">
                  <div>
                    <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Amount (NGN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted font-bold text-sm">₦</span>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        value={depAmount}
                        onChange={(e) => setDepAmount(e.target.value)}
                        className="w-full bg-fn-dark border border-fn-gborder rounded pl-8 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                        placeholder="1,000"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[500, 1000, 5000, 10000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setDepAmount(String(v))}
                          className="flex-1 text-[10px] font-bold tracking-wider bg-fn-dark border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 py-1.5 rounded-sm transition-all"
                        >
                          ₦{v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {depAmount && Number(depAmount) > 0 && (
                    <div className="bg-fn-dark border border-fn-gborder rounded p-4 space-y-2 text-sm font-mono">
                      <div className="flex justify-between text-fn-muted">
                        <span>Amount entered</span>
                        <span className="text-fn-text">{fmt(Number(depAmount))}</span>
                      </div>
                      <div className="flex justify-between text-fn-muted">
                        <span>Platform fee (10%)</span>
                        <span className="text-fn-red">− {fmt(depFee)}</span>
                      </div>
                      <div className="border-t border-fn-gborder pt-2 flex justify-between font-bold">
                        <span className="text-fn-muted uppercase tracking-wider text-xs">You will receive</span>
                        <span className="text-fn-green">{fmt(depCredited)}</span>
                      </div>
                    </div>
                  )}

                  {payErr && (
                    <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{payErr}</p>
                  )}

                  <button
                    type="submit"
                    disabled={paying || !depAmount}
                    className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                  >
                    {paying ? 'Redirecting to Paystack...' : 'Proceed to Pay'}
                  </button>
                </form>
              </div>

              {/* Transaction history */}
              <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-5 h-5 text-fn-muted" />
                  <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Transaction History</h2>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-fn-dark rounded animate-pulse" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-10">
                    <TrendingUp className="w-8 h-8 text-fn-muted mx-auto mb-3" />
                    <p className="text-fn-muted text-sm">No transactions yet</p>
                    <p className="text-fn-muted text-xs mt-1">Make your first deposit to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-fn-gborder last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-fn-muted text-[10px] uppercase tracking-wider">{typeLabel(tx.type)}</span>
                            {statusBadge(tx.status)}
                          </div>
                          <p className="text-fn-text text-xs truncate max-w-[220px]">{tx.description}</p>
                          <p className="text-fn-muted text-[10px] mt-0.5">
                            {new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`font-bold font-mono text-sm shrink-0 ml-4 ${typeColor(tx.type)}`}>
                          {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── WITHDRAW TAB ── */}
          {tab === 'withdraw' && (
            <>
              {/* Bank account */}
              <BankAccountSection bankAccount={bankAccount} onSaved={(acct) => setBankAccount(acct)} />

              {/* Withdrawal form */}
              <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ArrowUpCircle className="w-5 h-5 text-fn-green" />
                  <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Withdraw Funds</h2>
                </div>

                {hasPending && (
                  <div className="flex items-start gap-2 text-fn-yellow text-xs bg-fn-yellow/10 border border-fn-yellow/20 rounded px-3 py-2 mb-4">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    You have a pending withdrawal request. Cancel it below to submit a new one.
                  </div>
                )}

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Amount (NGN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted font-bold text-sm">₦</span>
                      <input
                        type="number"
                        min="1000"
                        step="100"
                        value={wdAmount}
                        onChange={(e) => setWdAmount(e.target.value)}
                        disabled={hasPending || !bankAccount}
                        className="w-full bg-fn-dark border border-fn-gborder rounded pl-8 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors disabled:opacity-50"
                        placeholder="1,000"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[1000, 5000, 10000, 50000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          disabled={hasPending || !bankAccount}
                          onClick={() => setWdAmount(String(v))}
                          className="flex-1 text-[10px] font-bold tracking-wider bg-fn-dark border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 py-1.5 rounded-sm transition-all disabled:opacity-40"
                        >
                          ₦{v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {wdAmount && Number(wdAmount) > 0 && (
                    <div className="bg-fn-dark border border-fn-gborder rounded p-4 space-y-2 text-sm font-mono">
                      <div className="flex justify-between text-fn-muted">
                        <span>Withdrawal amount</span>
                        <span className="text-fn-text">{fmt(Number(wdAmount))}</span>
                      </div>
                      <div className="flex justify-between text-fn-muted">
                        <span>Fee (5%)</span>
                        <span className="text-fn-red">− {fmt(wdFee)}</span>
                      </div>
                      <div className="border-t border-fn-gborder pt-2 flex justify-between font-bold">
                        <span className="text-fn-muted uppercase tracking-wider text-xs">You will receive</span>
                        <span className="text-fn-green">{fmt(wdNet)}</span>
                      </div>
                    </div>
                  )}

                  {wdErr && (
                    <div className="flex items-start gap-2 text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      {wdErr}
                    </div>
                  )}

                  {wdSuccess && (
                    <div className="flex items-start gap-2 text-fn-green text-xs bg-fn-green/10 border border-fn-green/20 rounded px-3 py-2">
                      <CheckCircle size={12} className="mt-0.5 shrink-0" />
                      {wdSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={wdBusy || hasPending || !bankAccount || !wdAmount}
                    className="w-full bg-fn-green text-fn-black font-bold py-2.5 rounded text-sm uppercase tracking-widest hover:bg-fn-gdim transition-colors disabled:opacity-50"
                  >
                    {wdBusy ? 'Submitting...' : 'Request Withdrawal'}
                  </button>

                  {!bankAccount && (
                    <p className="text-fn-muted text-[11px] text-center">
                      Set up your payout account above before withdrawing.
                    </p>
                  )}
                </form>
              </div>

              {/* Withdrawal history */}
              <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="w-5 h-5 text-fn-muted" />
                  <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Withdrawal History</h2>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-14 bg-fn-dark rounded animate-pulse" />)}
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center py-10">
                    <ArrowUpCircle className="w-8 h-8 text-fn-muted mx-auto mb-3" />
                    <p className="text-fn-muted text-sm">No withdrawals yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 bg-fn-dark border border-fn-gborder rounded">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {wdStatusBadge(w.status)}
                            <span className="text-fn-muted text-[10px]">
                              {new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-fn-text text-xs font-mono">
                            {fmt(w.amount)} → {fmt(w.amount_sent)} after fee
                          </p>
                          <p className="text-fn-muted text-[10px] mt-0.5">
                            {w.bank_name} · ****{w.account_number.slice(-4)} · {w.account_name}
                          </p>
                          {w.admin_note && (
                            <p className="text-fn-yellow text-[10px] mt-0.5">Note: {w.admin_note}</p>
                          )}
                        </div>
                        {w.status === 'Pending' && (
                          <button
                            onClick={() => handleCancel(w.id)}
                            disabled={cancelling === w.id}
                            className="ml-4 shrink-0 text-fn-red hover:text-fn-red/80 text-[10px] font-bold uppercase tracking-wider border border-fn-red/30 hover:border-fn-red/60 px-3 py-1.5 rounded transition-all disabled:opacity-50"
                          >
                            {cancelling === w.id ? <Loader2 size={11} className="animate-spin" /> : 'Cancel'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fn-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-fn-green border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WalletContent />
    </Suspense>
  );
}
