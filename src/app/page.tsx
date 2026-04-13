"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { athletes, wagerMarkets, recentTransfers } from "@/lib/data";
import { Trophy, Users, Award, Zap, ChevronRight, TrendingUp, Clock } from "lucide-react";

const stats = [
  { value: "1,242+", label: "Sector Players",   icon: Users },
  { value: "48",     label: "Tournaments",       icon: Trophy },
  { value: "12",     label: "Championships",     icon: Award },
  { value: "₦4.2M",  label: "Total Prize Pool",  icon: Zap },
];

function StatCounter({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center sm:items-start gap-1 p-3 border border-fn-gborder bg-fn-card/50 rounded-sm flex-1 min-w-[110px]">
      <Icon size={13} className="text-fn-green" />
      <span className="font-display text-xl sm:text-2xl font-black text-fn-text glow-text">{value}</span>
      <span className="fn-label">{label}</span>
    </div>
  );
}

function AthleteCard({ athlete, rank }: { athlete: typeof athletes[0]; rank: number }) {
  const colors = ["#00ff41", "#f0c040", "#ff6b8a", "#00aaff"];
  const col = colors[rank % colors.length];
  return (
    <Link href="/athletes" className="group relative bg-fn-card border border-fn-gborder hover:border-fn-green/50 transition-all rounded-sm overflow-hidden flex-shrink-0 w-40 sm:w-48">
      {/* Avatar area */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-b from-fn-card2 to-fn-dark flex items-center justify-center overflow-hidden">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-black border-2 transition-all group-hover:scale-105"
          style={{ borderColor: col, color: col, background: `${col}15` }}>
          {athlete.tag[0]}
        </div>
        {/* Rank badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase"
          style={{ background: `${col}20`, border: `1px solid ${col}50`, color: col }}>
          #{athlete.rankNum}
        </div>
        {/* Status */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="live-dot" style={{ background: col }} />
          <span className="text-[7px] font-bold tracking-widest uppercase" style={{ color: col }}>ACTIVE</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="text-[11px] font-bold text-fn-text tracking-wide mb-0.5">{athlete.tag}</div>
        <div className="fn-label mb-2">{athlete.rank}</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { v: athlete.kills, l: "K/D" },
            { v: athlete.headshots, l: "HS" },
            { v: athlete.matches, l: "MTH" },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="text-[10px] font-bold text-fn-text">{v}</div>
              <div className="fn-label text-[7px]">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all group-hover:opacity-100 opacity-0" style={{ background: col }} />
    </Link>
  );
}

function WagerPreviewCard({ market }: { market: typeof wagerMarkets[0] }) {
  const opt = market.options[0];
  return (
    <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 flex-shrink-0 w-72 sm:w-80">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${
          market.tag === "CRITICAL MATCH" ? "bg-fn-red/20 text-fn-red border border-fn-red/30" :
          market.tag === "STAT WAGER" ? "bg-fn-yellow/20 text-fn-yellow border border-fn-yellow/30" :
          "bg-fn-green/20 text-fn-green border border-fn-gborder"
        }`}>{market.tag}</span>
        <span className="fn-label">{market.poolSize}</span>
      </div>
      <h3 className="text-xs font-bold text-fn-text leading-snug mb-3">{market.question}</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button className="pred-yes rounded-sm px-2 py-2.5 text-center">
          <div className="text-[10px] font-bold">BUY YES</div>
          <div className="text-base font-black">₦{opt.yesPrice}</div>
          <div className="text-[8px] opacity-70">{opt.yesReturn}</div>
        </button>
        <button className="pred-no rounded-sm px-2 py-2.5 text-center">
          <div className="text-[10px] font-bold">BUY NO</div>
          <div className="text-base font-black">₦{opt.noPrice}</div>
          <div className="text-[8px] opacity-70">{opt.noReturn}</div>
        </button>
      </div>
      <div className="flex items-center justify-between text-[9px] text-fn-muted">
        <span>{market.trades.toLocaleString()} trades</span>
        <span className="flex items-center gap-1"><Clock size={9} /> {market.endsIn}</span>
      </div>
    </div>
  );
}

const TICKER_ITEMS = [
  "ATHLEGAME 3-1 NAIJA FORCE • LIVE",
  "PUBG NATIONAL CHAMPIONSHIP 2026 — REGISTRATION OPEN",
  "PHANTOM_NG RANKED #1 IN NIGERIA PRO LEAGUE",
  "TRANSFER WINDOW CLOSES IN 8 DAYS",
  "NEW WAGER MARKETS ADDED — ₦482K POOL",
];

export default function HomePage() {
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicker(p => (p + 1) % TICKER_ITEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Live ticker */}
      <div className="bg-fn-card border-b border-fn-gborder px-4 py-1.5 flex items-center gap-3 overflow-hidden">
        <span className="text-[8px] font-bold text-fn-green tracking-widest uppercase flex-shrink-0 flex items-center gap-1.5">
          <span className="live-dot" /> LIVE FEED
        </span>
        <div className="overflow-hidden flex-1">
          <span className="text-[9px] text-fn-text tracking-wider animate-fade-in" key={ticker}>
            {TICKER_ITEMS[ticker]}
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-4 sm:px-8 lg:px-12 hero-gradient bg-grid-fn bg-grid overflow-hidden">
        {/* Decorative corner lines */}
        <div className="absolute top-8 left-4 w-16 h-16 border-l-2 border-t-2 border-fn-green/30 pointer-events-none" />
        <div className="absolute bottom-8 right-4 w-16 h-16 border-r-2 border-b-2 border-fn-green/30 pointer-events-none" />

        <div className="max-w-4xl animate-slide-u">
          <p className="fn-label mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-fn-green inline-block" />
            SECTOR 11: TACTICAL COMMAND INTERFACE
          </p>
          <h1 className="font-display font-black uppercase leading-none mb-6">
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl text-fn-text tracking-tight">FRAG</span>
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl text-fn-green tracking-tight glow-text">NAIJA</span>
          </h1>
          <p className="text-fn-text text-xs sm:text-sm tracking-wider max-w-lg mb-8 leading-relaxed">
            Nigeria&apos;s premier esports command platform. Compete in elite tournaments,
            track top athletes, and place tactical wagers on live matches.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tournaments" className="fn-btn inline-flex items-center gap-2 text-[11px]">
              <Trophy size={13} /> JOIN TOURNAMENTS
            </Link>
            <Link href="/athletes" className="fn-btn-outline inline-flex items-center gap-2 text-[11px]">
              EXPLORE ATHLETES <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mt-10 max-w-2xl">
          {stats.map((s) => <StatCounter key={s.label} {...s} />)}
        </div>
      </section>

      {/* Top Athletes */}
      <section className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1">SECTOR LEADERS</p>
            <h2 className="section-title">TOP ATHLETES</h2>
          </div>
          <Link href="/athletes" className="fn-btn-ghost flex items-center gap-1 text-[10px]">
            VIEW ALL <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
          {athletes.map((a, i) => <AthleteCard key={a.id} athlete={a} rank={i} />)}
        </div>
      </section>

      {/* Wager Preview */}
      <section className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder bg-fn-card/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5"><Zap size={9} /> TACTICAL HUB 06</p>
            <h2 className="section-title">WAGER ZONE</h2>
          </div>
          <Link href="/wager" className="fn-btn inline-flex items-center gap-1 text-[10px] px-3 py-1.5">
            ENTER ZONE <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {wagerMarkets.slice(0, 3).map((m) => <WagerPreviewCard key={m.id} market={m} />)}
        </div>
      </section>

      {/* Pending Payables */}
      <section className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1">TRANSFER ACTIVITY</p>
            <h2 className="section-title">PENDING PAYABLES</h2>
          </div>
          <Link href="/transfer-window" className="fn-btn-ghost flex items-center gap-1 text-[10px]">
            VIEW ALL <ChevronRight size={11} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-fn-gborder">
                {["Player", "From", "To", "Value", "Status", "Date"].map((h) => (
                  <th key={h} className="fn-label pb-3 text-left pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTransfers.map((t, i) => (
                <tr key={i} className="border-b border-fn-gborder/50 hover:bg-fn-card/50 transition-colors">
                  <td className="py-3 pr-4 text-[11px] font-bold text-fn-text">{t.player}</td>
                  <td className="py-3 pr-4 text-[10px] text-fn-muted">{t.from}</td>
                  <td className="py-3 pr-4 text-[10px] text-fn-text">{t.to}</td>
                  <td className="py-3 pr-4 text-[10px] text-fn-yellow font-bold">{t.value}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${
                      t.status === "SOLD" ? "bg-fn-red/20 text-fn-red border border-fn-red/30" :
                      "bg-fn-yellow/20 text-fn-yellow border border-fn-yellow/30"
                    }`}>{t.status}</span>
                  </td>
                  <td className="py-3 text-[10px] text-fn-muted">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recruitment banner */}
        <div className="mt-6 p-4 sm:p-6 bg-fn-card border border-fn-gborder rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={12} className="text-fn-green" />
              <span className="fn-label text-fn-green">RECRUITMENT OPEN</span>
            </div>
            <p className="text-xs text-fn-text tracking-wide">FRAG QUALIFIED ATHLETES IN THE SECTOR TRIALS.</p>
          </div>
          <Link href="/athletes" className="fn-btn whitespace-nowrap text-[10px]">JOIN THE RANKS</Link>
        </div>
      </section>
    </div>
  );
}
