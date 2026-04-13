"use client";
import { useState, useEffect } from "react";
import { recentTransfers, freeAgents, marketActivity } from "@/lib/data";
import { Clock, TrendingUp, Users, Filter } from "lucide-react";

function useCountdown(targetDays: number, targetHrs: number, targetMins: number) {
  const [time, setTime] = useState({ d: targetDays, h: targetHrs, m: targetMins, s: 0 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        const { d, h, m, s } = prev;
        if (s > 0) return { d, h, m, s: s - 1 };
        if (m > 0) return { d, h, m: m - 1, s: 59 };
        if (h > 0) return { d, h: h - 1, m: 59, s: 59 };
        if (d > 0) return { d: d - 1, h: 23, m: 59, s: 59 };
        return { d: 0, h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

type FilterTab = "ALL" | "SOLD" | "ON LOAN" | "FREE AGENT";

export default function TransferWindowPage() {
  const countdown = useCountdown(8, 14, 22);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const filters: FilterTab[] = ["ALL", "SOLD", "ON LOAN", "FREE AGENT"];

  const filteredTransfers =
    activeFilter === "ALL"
      ? recentTransfers
      : recentTransfers.filter((t) =>
          activeFilter === "ON LOAN" ? t.status === "LOAN" : t.status === activeFilter
        );

  return (
    <div className="min-h-screen">
      {/* Header with countdown */}
      <div className="px-4 sm:px-8 lg:px-12 py-8 border-b border-fn-gborder bg-fn-card/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="fn-label mb-1">CONTRACT ANALYSIS</div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-white tracking-tight">
              TRANSFER<br />WINDOW
            </h1>
          </div>

          {/* Countdown */}
          <div className="flex flex-col items-start lg:items-end">
            <div className="fn-label mb-2 flex items-center gap-1.5">
              <Clock size={9} /> CLOSING FREQUENCY
            </div>
            <div className="flex items-baseline gap-2 font-display font-black">
              {[
                { v: countdown.d, l: "DAYS" },
                { v: countdown.h, l: "HRS"  },
                { v: countdown.m, l: "MIN"  },
                { v: countdown.s, l: "SEC"  },
              ].map(({ v, l }, i) => (
                <div key={l} className="flex items-baseline gap-1">
                  {i > 0 && <span className="text-fn-muted text-2xl">·</span>}
                  <span className="text-fn-yellow text-3xl sm:text-4xl tabular-nums animate-countdown"
                    style={{ minWidth: "2ch", display: "inline-block", textAlign: "center" }}>
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="text-fn-muted text-[9px] tracking-widest">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Filter tabs */}
            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Filter size={11} className="text-fn-muted" />
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase rounded-sm transition-all ${
                      activeFilter === f
                        ? "bg-fn-green text-fn-black"
                        : "border border-fn-gborder text-fn-muted hover:text-fn-text hover:border-fn-green/40"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Recent transfers table */}
              <div className="fn-label mb-3">RECENT TRANSFERS</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-fn-gborder">
                      {["Player", "From", "To", "Value", "Status", "Date"].map((h) => (
                        <th key={h} className="fn-label pb-3 text-left pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-fn-muted text-[10px]">
                          No transfers match this filter
                        </td>
                      </tr>
                    ) : (
                      filteredTransfers.map((t, i) => (
                        <tr key={i} className="border-b border-fn-gborder/50 hover:bg-fn-card/50 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-fn-green/15 border border-fn-gborder flex items-center justify-center text-[10px] font-bold text-fn-green">
                                {t.player[0]}
                              </div>
                              <span className="text-[11px] font-bold text-white">{t.player}</span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-4 text-[10px] text-fn-muted">{t.from}</td>
                          <td className="py-3.5 pr-4 text-[10px] text-fn-text font-bold">{t.to}</td>
                          <td className="py-3.5 pr-4 text-[10px] text-fn-yellow font-bold">{t.value}</td>
                          <td className="py-3.5 pr-4">
                            <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 ${
                              t.status === "SOLD"
                                ? "bg-fn-red/20 text-fn-red border border-fn-red/30"
                                : "bg-fn-yellow/20 text-fn-yellow border border-fn-yellow/30"
                            }`}>{t.status}</span>
                          </td>
                          <td className="py-3.5 text-[10px] text-fn-muted">{t.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Free agents */}
            <div>
              <div className="fn-label mb-3 flex items-center justify-between">
                UNRESTRICTED FREE AGENTS
                <button className="fn-btn-ghost text-[9px]">VIEW ALL ROSTER →</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {freeAgents.map((agent) => (
                  <div key={agent.tag} className="bg-fn-card border border-fn-gborder rounded-sm p-4 hover:border-fn-green/40 transition-all group">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-sm bg-fn-green/10 border border-fn-gborder flex items-center justify-center mb-3 group-hover:border-fn-green/40 transition-colors">
                      <span className="font-display text-2xl font-black text-fn-green">{agent.tag[0]}</span>
                    </div>
                    <div className="text-[8px] font-bold text-fn-yellow tracking-widest uppercase mb-1">{agent.badge}</div>
                    <div className="text-xs font-bold text-white mb-0.5">{agent.tag}</div>
                    <div className="fn-label mb-3">{agent.rank}</div>

                    <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                      {[
                        { v: agent.age,      l: "AGE"   },
                        { v: agent.matches,  l: "MTCH"  },
                        { v: agent.winRate,  l: "W/R"   },
                      ].map(({ v, l }) => (
                        <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-1.5">
                          <div className="text-[10px] font-bold text-white">{v}</div>
                          <div className="fn-label text-[7px]">{l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="fn-label">ASKING FEE</span>
                      <span className="text-[11px] font-bold text-fn-green">{agent.asking}</span>
                    </div>
                    <button className="fn-btn w-full text-[9px] py-2">PROPOSE CONTRACT</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Activity sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={12} className="text-fn-green" />
                <span className="fn-label text-fn-green">MARKET ACTIVITY</span>
              </div>
              <div className="space-y-3">
                {marketActivity.map((item, i) => (
                  <div key={i} className="flex gap-2.5 pb-3 border-b border-fn-gborder/50 last:border-0 last:pb-0">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                      item.type === "alert" ? "bg-fn-red animate-pulse-g" :
                      item.type === "news"  ? "bg-fn-green" : "bg-fn-yellow"
                    }`} />
                    <div>
                      <p className="text-[9px] text-fn-text leading-relaxed">{item.text}</p>
                      <span className="text-[8px] text-fn-muted">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 fn-btn-ghost text-[9px] w-full border border-fn-gborder py-2">
                DOWNLOAD FULL LOG
              </button>
            </div>

            {/* Join wager CTA */}
            <div className="bg-fn-card border border-fn-green/30 rounded-sm p-4">
              <div className="fn-label text-fn-green mb-2 flex items-center gap-1.5">
                <Users size={9} /> JOIN WAGER
              </div>
              <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
                Predict transfer outcomes and player signings. Earn FRG coins for accurate calls.
              </p>
              <input
                type="text"
                placeholder="ENTER COMMAND CENTER"
                className="w-full bg-fn-dark border border-fn-gborder text-fn-text text-[10px] px-3 py-2.5 mb-3 outline-none focus:border-fn-green/50 placeholder:text-fn-muted"
              />
              <button className="fn-btn w-full text-[10px]">JOIN WAGER NOW</button>
            </div>

            {/* Stats summary */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3">WINDOW STATS</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "₦12,250,000", l: "Total Value" },
                  { v: "2.4x",        l: "Avg Multiplier" },
                  { v: "14",          l: "Total Moves" },
                  { v: "3",           l: "Free Agents" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-2.5 text-center">
                    <div className="text-xs font-bold text-fn-green">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
