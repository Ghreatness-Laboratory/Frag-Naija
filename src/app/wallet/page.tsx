'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, ArrowDownCircle, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const FEE_PERCENT = 10;

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

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeColor(type: string) {
  if (type === 'deposit' || type === 'credit' || type === 'winnings' || type === 'refund') return 'text-fn-green';
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

export default function WalletPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [wallet,  setWallet]  = useState<WalletData | null>(null);
  const [history, setHistory] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authErr, setAuthErr] = useState(false);

  const [amount,    setAmount]    = useState('');
  const [paying,    setPaying]    = useState(false);
  const [payErr,    setPayErr]    = useState('');
  const [showSuccess, setShowSuccess] = useState(searchParams.get('status') === 'success');

  const fee        = amount ? Math.round(Number(amount) * FEE_PERCENT) / 100 : 0;
  const credited   = amount ? Number(amount) - fee : 0;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/wallet');
    if (res.status === 401) { setAuthErr(true); setLoading(false); return; }
    if (res.ok) {
      const data = await res.json();
      setWallet(data.wallet);
      setHistory(data.history || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Remove ?status=success from URL after showing banner
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
    if (!amount || Number(amount) < 500) { setPayErr('Minimum deposit is ₦500'); return; }
    setPaying(true);
    try {
      const res  = await fetch('/api/deposit/pay', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialise payment');
      window.location.href = data.authorization_url;
    } catch (err: unknown) {
      setPayErr(err instanceof Error ? err.message : 'Payment error');
      setPaying(false);
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
      {/* Success banner */}
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
        {/* Balance + stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Balance card */}
          <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
            <p className="text-fn-muted text-xs uppercase tracking-widest mb-1">Available Balance</p>
            {loading ? (
              <div className="h-9 w-32 bg-fn-dark rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-fn-green font-mono">{fmt(wallet?.balance ?? 0)}</p>
            )}
          </div>

          {/* Stats */}
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

          {/* Notices */}
          <div className="bg-fn-dark border border-fn-gborder rounded-lg p-4 space-y-2">
            <p className="text-fn-muted text-[11px] leading-relaxed">
              <span className="text-fn-yellow font-bold">Fee notice:</span> A 10% platform fee applies to all deposits. Minimum deposit is ₦500.
            </p>
            <p className="text-fn-muted text-[11px] leading-relaxed">
              <span className="text-fn-yellow font-bold">Payout cap:</span> Maximum payout per bet is $2,000 USD.
            </p>
          </div>
        </div>

        {/* Deposit form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-fn-card border border-fn-gborder rounded-lg p-6">
            <div className="flex items-center gap-2 mb-5">
              <ArrowDownCircle className="w-5 h-5 text-fn-green" />
              <h2 className="text-fn-text font-bold text-sm uppercase tracking-widest">Deposit Funds</h2>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              {/* Amount input */}
              <div>
                <label className="block text-fn-muted text-xs uppercase tracking-widest mb-2">Amount (NGN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted font-bold text-sm">₦</span>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-fn-dark border border-fn-gborder rounded pl-8 pr-4 py-2.5 text-fn-text text-sm focus:outline-none focus:border-fn-green transition-colors"
                    placeholder="1,000"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 5000, 10000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="flex-1 text-[10px] font-bold tracking-wider bg-fn-dark border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 py-1.5 rounded-sm transition-all"
                    >
                      ₦{v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee breakdown */}
              {amount && Number(amount) > 0 && (
                <div className="bg-fn-dark border border-fn-gborder rounded p-4 space-y-2 text-sm font-mono">
                  <div className="flex justify-between text-fn-muted">
                    <span>Amount entered</span>
                    <span className="text-fn-text">{fmt(Number(amount))}</span>
                  </div>
                  <div className="flex justify-between text-fn-muted">
                    <span>Platform fee (10%)</span>
                    <span className="text-fn-red">− {fmt(fee)}</span>
                  </div>
                  <div className="border-t border-fn-gborder pt-2 flex justify-between font-bold">
                    <span className="text-fn-muted uppercase tracking-wider text-xs">You will receive</span>
                    <span className="text-fn-green">{fmt(credited)}</span>
                  </div>
                </div>
              )}

              {payErr && (
                <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{payErr}</p>
              )}

              <button
                type="submit"
                disabled={paying || !amount}
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
                      <p className="text-fn-muted text-[10px] mt-0.5">{new Date(tx.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`font-bold font-mono text-sm shrink-0 ml-4 ${typeColor(tx.type)}`}>
                      {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
