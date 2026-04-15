"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { useActiveWagers, useBanks, useFeatured, useMe, useMyWagers, usePlaceWager, usePredictors, useWalletTransactions, useWithdraw } from "@/lib/hooks";

type CurrentUser = {
  id?: string | null;
  email?: string | null;
  wallet?: {
    balance?: number | string | null;
  } | null;
} | null;

type CurrentMarket = Record<string, unknown> & {
  id: string | number;
};

type CurrentUserWager = {
  id: string | number;
  selection?: "YES" | "NO" | string | null;
  amount?: number | string | null;
  potential?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  odds?: number | string | null;
  wager?: {
    question?: string | null;
    subtitle?: string | null;
    closes_at?: string | null;
  } | null;
};

type WalletTransaction = {
  id: string | number;
  type?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type Bank = {
  name: string;
  code: string;
};

function WithdrawalModal({
  open,
  onClose,
  balance,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("1000");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: banks } = useBanks();
  const { withdraw, loading: withdrawLoading } = useWithdraw();

  if (!open) return null;

  async function handleWithdraw() {
    if (!amount || !accountNumber || !bankCode || !accountName) {
      setMessage("All fields are required.");
      return;
    }

    const numericAmount = Number(amount);
    if (numericAmount < 1000) {
      setMessage("Minimum withdrawal is ₦1,000.");
      return;
    }

    if (numericAmount > balance) {
      setMessage("Insufficient funds.");
      return;
    }

    setMessage(null);

    try {
      await withdraw({
        amount: numericAmount,
        account_number: accountNumber,
        bank_code: bankCode,
        name: accountName,
      });
      setIsSuccess(true);
      onSuccess();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Withdrawal failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-fn-gborder bg-fn-card p-6 shadow-2xl">
        <h2 className="mb-4 font-display text-xl font-black uppercase tracking-tight text-fn-text">
          WITHDRAW FUNDS
        </h2>

        {isSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="rounded-sm border border-fn-green/30 bg-fn-green/10 p-4">
              <Zap size={24} className="mx-auto mb-2 text-fn-green" />
              <p className="text-sm font-bold text-fn-text uppercase tracking-widest">Withdrawal Initiated</p>
              <p className="mt-1 text-[10px] text-fn-muted">
                Your transfer of {formatCurrency(Number(amount))} is being processed.
              </p>
            </div>
            <button onClick={onClose} className="fn-btn w-full py-3">
              CLOSE
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">AMOUNT (MIN ₦1,000)</label>
              <div className="flex items-center rounded-sm border border-fn-gborder bg-fn-dark px-3">
                <span className="mr-2 text-[10px] text-fn-muted">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-[11px] font-bold text-fn-text outline-none"
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAmount(String(Math.floor(balance)))}
                className="rounded-sm border border-fn-gborder bg-fn-dark py-1.5 text-[9px] font-bold text-fn-muted hover:border-fn-green/30 hover:text-fn-text transition-all"
              >
                USE MAX
              </button>
              <button
                onClick={() => setAmount("1000")}
                className="rounded-sm border border-fn-gborder bg-fn-dark py-1.5 text-[9px] font-bold text-fn-muted hover:border-fn-green/30 hover:text-fn-text transition-all"
              >
                MINIMUM (₦1K)
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">SELECT BANK</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none appearance-none"
              >
                <option value="">Choose your bank...</option>
                {Array.isArray(banks) &&
                  (banks as Bank[]).map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">ACCOUNT NUMBER</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none"
                placeholder="10-digit number"
                maxLength={10}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-fn-muted uppercase tracking-widest">ACCOUNT NAME</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-[11px] font-bold text-fn-text outline-none"
                placeholder="Full Legal Name"
              />
            </div>

            {message && <p className="text-[10px] font-bold text-fn-red uppercase">{message}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="fn-btn-outline flex-1 py-3 text-[10px] uppercase">
                CANCEL
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !bankCode || !accountNumber || !accountName}
                className={`fn-btn flex-1 py-3 text-[10px] uppercase ${
                  withdrawLoading || !bankCode || !accountNumber || !accountName
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {withdrawLoading ? "PROCESSING..." : "CONFIRM WITHDRAW"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount || 0);
}

function formatCountdown(value?: string | null) {
  if (!value) {
    return "Closing time TBD";
  }

  const closesAt = new Date(value);
  if (Number.isNaN(closesAt.getTime())) {
    return value;
  }

  const diff = closesAt.getTime() - Date.now();
  if (diff <= 0) {
    return "Closed";
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "Time TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTransactionAmount(amount: number) {
  const absAmount = Math.abs(amount);
  return `${amount >= 0 ? "+" : "-"}${formatCurrency(absAmount)}`;
}

function getPoolAmount(market: Record<string, unknown>) {
  const directPool = Number(
    market.pool_size ??
      market.pool ??
      market.total_pool ??
      market.amount_pool ??
      market.totalPool ??
      0
  );

  if (directPool > 0) {
    return directPool;
  }

  return Number(market.yes_pool ?? 0) + Number(market.no_pool ?? 0);
}

function getTradeCount(market: Record<string, unknown>) {
  const directCount = Number(
    market.trades ??
      market.trade_count ??
      market.bet_count ??
      market.total_bets ??
      0
  );

  if (directCount > 0) {
    return directCount;
  }

  return Number(market.yes_count ?? 0) + Number(market.no_count ?? 0);
}

function getImpliedSplit(yesOddsRaw: unknown, noOddsRaw: unknown) {
  const yesOdds = Number(yesOddsRaw);
  const noOdds = Number(noOddsRaw);

  if (yesOdds > 0 && noOdds > 0) {
    const yesProbability = 1 / yesOdds;
    const noProbability = 1 / noOdds;
    const total = yesProbability + noProbability;

    const yes = Math.round((yesProbability / total) * 100);
    return { yes, no: 100 - yes };
  }

  return { yes: 50, no: 50 };
}

function getMarketTag(market: Record<string, unknown>) {
  if (market.hot) {
    return {
      label: "HOT MARKET",
      className: "bg-fn-red/20 text-fn-red border-fn-red/30",
    };
  }

  return {
    label: "LIVE WAGER",
    className: "bg-fn-green/20 text-fn-green border-fn-gborder",
  };
}

function getMarketQuestion(market: Record<string, unknown>) {
  return (
    market.question ??
    market.title ??
    market.prompt ??
    market.name ??
    "Untitled wager market"
  );
}

function getMarketSubtitle(market: Record<string, unknown>) {
  const subtitle =
    market.subtitle ??
    market.description ??
    market.match_name ??
    market.market_type ??
    market.category;

  if (subtitle) {
    return String(subtitle);
  }

  return `Closes ${formatCountdown(String(market.closes_at ?? ""))}`;
}

function ProbBar({ yes, no }: { yes: number; no: number }) {
  return (
    <div className="mb-1 flex h-1.5 overflow-hidden rounded-sm">
      <div className="bg-fn-green/70 transition-all" style={{ width: `${yes}%` }} />
      <div className="bg-fn-red/70 transition-all" style={{ width: `${no}%` }} />
    </div>
  );
}

type PlayerOption = { label: string; odds: number };

function WagerCard({
  market,
  email,
  onPlaced,
}: {
  market: Record<string, unknown>;
  email?: string | null;
  onPlaced?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [amount, setAmount] = useState("500");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { placeWager, loading } = usePlaceWager();

  const isPlayerPick = market.type === "player_pick";
  const playerOptions: PlayerOption[] = isPlayerPick
    ? ((Array.isArray(market.options) ? market.options : []) as PlayerOption[])
    : [];

  const { yes, no } = getImpliedSplit(market.yes_odds, market.no_odds);
  const yesOdds = Number(market.yes_odds ?? 0);
  const noOdds = Number(market.no_odds ?? 0);
  const numericAmount = Number(amount || 0);
  const activeEmail = email ?? null;
  const canSubmit = Boolean(activeEmail && picked && numericAmount >= 100 && !loading);

  const pickedOption = isPlayerPick ? playerOptions.find((o) => o.label === picked) : null;
  const potentialReturn = isPlayerPick
    ? pickedOption ? numericAmount * pickedOption.odds : 0
    : picked === "YES"
      ? numericAmount * yesOdds
      : picked === "NO"
        ? numericAmount * noOdds
        : 0;

  const tag = getMarketTag(market);

  async function handlePlaceWager() {
    if (!activeEmail) { setMessage("Sign in first to place a wager."); return; }
    if (!picked) { setMessage(isPlayerPick ? "Pick a player before placing a wager." : "Choose YES or NO before placing a wager."); return; }
    if (numericAmount < 100) { setMessage("Minimum wager amount is NGN 100."); return; }
    setMessage(null);
    try {
      const result = await placeWager({
        wager_id: market.id,
        selection: picked,
        amount: numericAmount,
        email: activeEmail,
      });
      if (result.paid_from_wallet) {
        setMessage("Wager placed! Stake deducted from your wallet.");
        setPicked(null);
        onPlaced?.();
      } else {
        onPlaced?.();
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card transition-all hover:border-fn-green/30">
      <div className="px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-sm border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${tag.className}`}>
              {tag.label}
            </span>
            {isPlayerPick && (
              <span className="rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-fn-yellow">
                Player Pick
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="fn-label">{formatCompactCurrency(getPoolAmount(market))} pool</span>
            <button onClick={() => setSaved((current) => !current)} className="transition-colors">
              <Bookmark size={13} className={saved ? "fill-fn-green text-fn-green" : "text-fn-muted hover:text-fn-text"} />
            </button>
          </div>
        </div>

        <h3 className="mb-1 text-sm font-bold leading-snug text-fn-text sm:text-base">
          {String(getMarketQuestion(market))}
        </h3>
        <p className="fn-label">{getMarketSubtitle(market)}</p>
      </div>

      <div className="space-y-3 px-4 pb-3">
        {isPlayerPick ? (
          /* ── Player Pick UI ── */
          <div>
            <p className="fn-label mb-2">Pick a player to back</p>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {playerOptions.map((opt) => {
                const isSelected = picked === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setPicked((cur) => (cur === opt.label ? null : opt.label))}
                    className={`rounded-sm border px-3 py-3 text-left transition-all ${
                      isSelected
                        ? "border-fn-green bg-fn-green/10"
                        : "border-fn-gborder hover:border-fn-green/40 bg-fn-dark/60"
                    }`}
                  >
                    <div className={`text-[10px] font-bold truncate ${isSelected ? "text-fn-green" : "text-fn-text"}`}>
                      {opt.label}
                    </div>
                    <div className="font-display text-lg font-black text-fn-green mt-0.5">
                      {Number(opt.odds).toFixed(2)}×
                    </div>
                    <div className="mt-0.5 text-[8px] text-fn-muted">
                      {formatCurrency(numericAmount || 1000)} → {formatCurrency((numericAmount || 1000) * opt.odds)}
                    </div>
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="mt-2 flex items-center justify-between rounded-sm border border-fn-gborder/50 bg-fn-green/5 px-2 py-1.5 text-[9px]">
                <span className="text-fn-muted">{formatCurrency(numericAmount)} stake on <strong className="text-fn-text">{picked}</strong></span>
                <span className="font-bold text-fn-green">→ {formatCurrency(potentialReturn)}</span>
              </div>
            )}
          </div>
        ) : (
          /* ── Binary YES / NO UI ── */
          <div>
            <ProbBar yes={yes} no={no} />
            <div className="mb-3 flex justify-between fn-label">
              <span className="text-fn-green">YES {yes}%</span>
              <span className="text-fn-red">NO {no}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPicked((current) => (current === "YES" ? null : "YES"))}
                className={`rounded-sm px-3 py-3 text-center transition-all ${picked === "YES" ? "pred-yes active" : "pred-yes"}`}
              >
                <div className="mb-0.5 text-[10px] font-bold">BUY YES</div>
                <div className="font-display text-xl font-black">{yesOdds.toFixed(2)}x</div>
                <div className="mt-0.5 text-[8px] opacity-80">
                  {formatCurrency(numericAmount || 1000)} {"->"} {formatCurrency((numericAmount || 1000) * yesOdds)}
                </div>
              </button>
              <button
                onClick={() => setPicked((current) => (current === "NO" ? null : "NO"))}
                className={`rounded-sm px-3 py-3 text-center transition-all ${picked === "NO" ? "pred-no active" : "pred-no"}`}
              >
                <div className="mb-0.5 text-[10px] font-bold">BUY NO</div>
                <div className="font-display text-xl font-black">{noOdds.toFixed(2)}x</div>
                <div className="mt-0.5 text-[8px] opacity-80">
                  {formatCurrency(numericAmount || 1000)} {"->"} {formatCurrency((numericAmount || 1000) * noOdds)}
                </div>
              </button>
            </div>

            {picked && (
              <div className={`mt-2 flex items-center justify-between rounded-sm border px-2 py-1.5 text-[9px] ${
                picked === "YES" ? "border-fn-gborder/50 bg-fn-green/5 text-fn-muted" : "border-fn-gborder/50 bg-fn-red/5 text-fn-muted"
              }`}>
                <span>{formatCurrency(numericAmount)} stake</span>
                <span className={picked === "YES" ? "font-bold text-fn-green" : "font-bold text-fn-red"}>
                  Potential return {formatCurrency(potentialReturn)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center rounded-sm border border-fn-gborder bg-fn-dark px-3 min-w-0">
            <span className="mr-2 fn-label shrink-0">AMOUNT</span>
            <input
              type="number"
              min="100"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-[11px] font-bold text-fn-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            onClick={handlePlaceWager}
            className={`fn-btn shrink-0 whitespace-nowrap px-4 text-[10px] ${!canSubmit ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={!canSubmit}
          >
            {loading ? "..." : "PLACE WAGER"}
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          {["250", "500", "1000", "2500"].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value)}
              className={`rounded-sm border px-2 py-1 text-[8px] font-bold tracking-wide transition-all ${
                amount === value
                  ? "border-fn-green bg-fn-green/10 text-fn-green"
                  : "border-fn-gborder text-fn-muted hover:border-fn-green/40 hover:text-fn-text"
              }`}
            >
              {formatCurrency(Number(value))}
            </button>
          ))}
        </div>

        {!activeEmail && <p className="mt-2 text-[9px] text-fn-yellow">Sign in to unlock checkout for this market.</p>}
        {message && (
          <p className={`mt-2 text-[9px] ${
            message.startsWith("Wager placed") ? "text-fn-green" : "text-fn-red"
          }`}>{message}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-fn-gborder bg-fn-dark/50 px-4 py-2.5">
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <BarChart2 size={10} /> {getTradeCount(market).toLocaleString()} trades
        </div>
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <Clock size={10} /> {formatCountdown(String(market.closes_at ?? ""))}
        </div>
      </div>
    </div>
  );
}

function WagerPageContent() {
  const [showAll, setShowAll] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const { data: wagers, loading: wagersLoading, error: wagersError, refetch } = useActiveWagers();
  const { data: me, loading: meLoading, refetch: refetchMe } = useMe();
  const {
    data: myWagers,
    loading: myWagersLoading,
    error: myWagersError,
    refetch: refetchMyWagers,
  } = useMyWagers();
  const {
    data: walletTransactions,
    loading: walletTxLoading,
    error: walletTxError,
    refetch: refetchWalletTx,
  } = useWalletTransactions(8);
  const { data: predictorsData } = usePredictors();
  const { data: featuredData } = useFeatured();
  const currentUser = me as CurrentUser;
  const liveWagers = (Array.isArray(wagers) ? wagers : []) as CurrentMarket[];
  const currentUserWagers = (Array.isArray(myWagers) ? myWagers : []) as CurrentUserWager[];
  const walletTxList = (Array.isArray(walletTransactions) ? walletTransactions : []) as WalletTransaction[];
  const predictors = Array.isArray(predictorsData) ? predictorsData : [];
  const featured = Array.isArray(featuredData) ? featuredData : [];

  const allMarkets = liveWagers;
  const displayedMarkets = showAll ? allMarkets : allMarkets.slice(0, 4);
  const walletBalance = Number(currentUser?.wallet?.balance ?? 0);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-fn-gborder bg-fn-card/20 px-4 py-6 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid-fn bg-grid opacity-20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-1.5 fn-label">
              <Zap size={9} className="text-fn-green" /> TACTICAL HUB 06
            </div>
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-fn-text sm:text-5xl">
              WAGER ZONE
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-sm border border-fn-yellow/30 bg-fn-card px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-fn-yellow/40 bg-fn-yellow/20 text-sm">
                <Wallet size={14} className="text-fn-yellow" />
              </div>
              <div>
                <div className="fn-label">CURRENT BALANCE</div>
                <div className="font-display text-xl font-black text-fn-yellow">
                  {meLoading ? "Loading..." : formatCurrency(walletBalance)}
                </div>
              </div>
            </div>
            
            {currentUser?.email && (
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="fn-btn-outline h-full px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-fn-yellow/10 hover:border-fn-yellow/50"
              >
                WITHDRAW
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-8 lg:px-12">
        {isWithdrawOpen && (
          <WithdrawalModal
            open={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            balance={walletBalance}
            onSuccess={() => {
              refetchMe();
              refetchWalletTx();
            }}
          />
        )}
        {status === "success" && (
          <div className="mb-4 rounded-sm border border-fn-green/30 bg-fn-green/10 px-4 py-3 text-[11px] text-fn-text">
            Payment completed. Your wager is being confirmed and will show up after Paystack webhook processing.
          </div>
        )}

        {wagersError && (
          <div className="mb-4 rounded-sm border border-fn-red/30 bg-fn-red/10 px-4 py-3 text-[11px] text-fn-text">
            Unable to load live markets right now: {wagersError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            {featured.length > 0 && (
              <div>
                <div className="fn-label mb-2 flex items-center gap-1.5">
                  <Zap size={9} className="text-fn-red" /> WHAT&apos;S HOT NOW
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {featured.map((item) => (
                    <div
                      key={String((item as Record<string, unknown>).id)}
                      className="flex-shrink-0 bg-fn-card border border-fn-gborder rounded-sm px-3 py-2.5 min-w-[160px] hover:border-fn-green/30 transition-colors"
                    >
                      <span className="inline-block text-[7px] font-bold bg-fn-red/20 text-fn-red border border-fn-red/30 px-1.5 py-0.5 rounded-sm mb-1.5">
                        {String((item as Record<string, unknown>).badge || "HOT")}
                      </span>
                      <p className="text-[10px] font-bold text-fn-text leading-snug">
                        {String((item as Record<string, unknown>).label)}
                      </p>
                      {Boolean((item as Record<string, unknown>).type) && (
                        <p className="fn-label mt-0.5">
                          {String((item as Record<string, unknown>).type).toUpperCase()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 fn-label">
              <span className="live-dot" /> LIVE MARKETS - {allMarkets.length} OPEN
            </div>

            {wagersLoading && (
              <div className="rounded-sm border border-fn-gborder bg-fn-card p-6 text-[11px] text-fn-muted">
                Loading active wager markets...
              </div>
            )}

            {!wagersLoading && !allMarkets.length && (
              <div className="rounded-sm border border-fn-gborder bg-fn-card p-6">
                <p className="text-sm font-bold text-fn-text">No live markets are open right now.</p>
                <p className="mt-2 text-[11px] text-fn-muted">
                  New tactical markets will appear here as soon as the admin desk opens them.
                </p>
              </div>
            )}

            {displayedMarkets.map((market) => (
              <WagerCard
                key={String(market.id)}
                market={market}
                email={currentUser?.email}
                onPlaced={() => {
                  refetch();
                  refetchMyWagers();
                  refetchWalletTx();
                }}
              />
            ))}

            {allMarkets.length > 4 && (
              <button
                onClick={() => setShowAll((current) => !current)}
                className="fn-btn-outline flex w-full items-center justify-center gap-2 py-3 text-[10px]"
              >
                {showAll ? (
                  <>
                    <ChevronUp size={12} /> SHOW LESS
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> LOAD {allMarkets.length - 4} MORE MARKETS
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4 xl:col-span-1">
            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Trophy size={12} className="text-fn-yellow" />
                <span className="fn-label text-fn-text">ELITE PREDICTORS</span>
              </div>
              <div className="space-y-2">
                {predictors.length === 0 ? (
                  <p className="text-[10px] text-fn-muted text-center py-3">No predictors ranked yet.</p>
                ) : (
                  (predictors as Record<string, unknown>[]).slice(0, 5).map((predictor, index) => (
                    <div
                      key={String(predictor.tag)}
                      className="flex items-center gap-3 rounded-sm border border-fn-gborder bg-fn-dark p-2 transition-colors hover:border-fn-green/30"
                    >
                      <span
                        className={`w-5 text-center text-[9px] font-bold ${
                          index === 0 ? "text-fn-yellow" : index === 1 ? "text-fn-text" : "text-fn-muted"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-fn-gborder bg-fn-green/10 text-[9px] font-bold text-fn-green">
                        {String(predictor.tag)[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-bold text-fn-text">{String(predictor.tag)}</div>
                        <div className="fn-label">{String(predictor.accuracy || "")} accuracy</div>
                      </div>
                      <span className="flex-shrink-0 text-[9px] font-bold text-fn-green">
                        {String(predictor.weekly_earnings || "")}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button className="fn-btn-outline mt-3 w-full py-2 text-[9px]">VIEW ALL RANKINGS</button>
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: allMarkets.length.toLocaleString(), label: "Open Markets", icon: BarChart2 },
                  { value: formatCompactCurrency(walletBalance), label: "Wallet Balance", icon: Wallet },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-center">
                    <Icon size={12} className="mx-auto mb-1 text-fn-green" />
                    <div className="font-display text-xl font-black text-fn-text">{value}</div>
                    <div className="fn-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="fn-label">MY ACTIVE PREDICTIONS</span>
                <span className="text-[9px] font-bold text-fn-green">{currentUserWagers.length} ACTIVE</span>
              </div>
              {myWagersLoading ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Loading your wager history...
                </div>
              ) : !currentUser?.email ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Sign in to view your active predictions and settled wager history.
                </div>
              ) : myWagersError ? (
                <div className="rounded-sm border border-fn-red/30 bg-fn-red/10 p-3 text-[10px] text-fn-text">
                  Unable to load your wagers right now: {myWagersError}
                </div>
              ) : !currentUserWagers.length ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  You have not placed any wagers yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentUserWagers.slice(0, 5).map((prediction) => {
                    const selection = String(prediction.selection ?? "N/A");
                    const statusLabel = String(prediction.status ?? "Pending");
                    const statusTone =
                      statusLabel === "Won"
                        ? { bg: "#00ff4120", color: "#00ff41", border: "#00ff4140" }
                        : statusLabel === "Lost"
                          ? { bg: "#ff4d4f20", color: "#ff4d4f", border: "#ff4d4f40" }
                          : { bg: "#f0c04020", color: "#f0c040", border: "#f0c04040" };

                    return (
                      <div key={String(prediction.id)} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold leading-tight text-fn-text">
                              {prediction.wager?.question || "Untitled wager market"}
                            </div>
                            <div className="fn-label">
                              {prediction.wager?.subtitle || `Closes ${formatShortDate(prediction.wager?.closes_at)}`}
                            </div>
                          </div>
                          <span
                            className="flex-shrink-0 px-1.5 py-0.5 text-[7px] font-bold tracking-widest"
                            style={{
                              background: statusTone.bg,
                              color: statusTone.color,
                              border: `1px solid ${statusTone.border}`,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {[
                            { value: selection, label: "PICK" },
                            { value: `${Number(prediction.odds ?? 0).toFixed(2)}x`, label: "ODDS" },
                            { value: formatCurrency(Number(prediction.amount ?? 0)), label: "STAKE" },
                          ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                              <div className="truncate text-[9px] font-bold text-fn-green">{value}</div>
                              <div className="fn-label text-[7px]">{label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex justify-between border-t border-fn-gborder/50 pt-2">
                          <span className="fn-label">POTENTIAL</span>
                          <span className="text-[10px] font-bold text-fn-green">
                            {formatCurrency(Number(prediction.potential ?? 0))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="fn-label">WALLET ACTIVITY</span>
                <span className="text-[9px] font-bold text-fn-green">{walletTxList.length} ITEMS</span>
              </div>
              {walletTxLoading ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Loading wallet history...
                </div>
              ) : !currentUser?.email ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  Sign in to see wallet transactions and payout history.
                </div>
              ) : walletTxError ? (
                <div className="rounded-sm border border-fn-red/30 bg-fn-red/10 p-3 text-[10px] text-fn-text">
                  Unable to load wallet history: {walletTxError}
                </div>
              ) : !walletTxList.length ? (
                <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[10px] text-fn-muted">
                  No wallet activity yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {walletTxList.map((tx) => {
                    const amount = Number(tx.amount ?? 0);
                    const tone = amount >= 0 ? "text-fn-green" : "text-fn-red";
                    return (
                      <div key={String(tx.id)} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-fn-text">
                              {tx.type || "Transaction"}
                            </div>
                            <div className="fn-label">
                              {tx.description || "Wallet activity logged"}
                            </div>
                          </div>
                          <div className={`text-[10px] font-bold ${tone}`}>
                            {formatTransactionAmount(amount)}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between border-t border-fn-gborder/50 pt-2">
                          <span className="fn-label">POSTED</span>
                          <span className="text-[9px] font-bold text-fn-green">
                            {formatShortDate(tx.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WagerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fn-dark" />}>
      <WagerPageContent />
    </Suspense>
  );
}
