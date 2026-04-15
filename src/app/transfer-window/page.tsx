"use client";
import { useState, useEffect, useCallback } from "react";
import { Clock, TrendingUp, Users, Filter } from "lucide-react";

type Transfer = {
  id: string;
  from_team: string | null;
  to_team: string | null;
  fee: number | null;
  status: string;
  date: string | null;
  notes: string | null;
  athletes: { id: string; name: string; ign: string } | null;
};

type FreeAgent = {
  id: string;
  name: string;
  ign: string;
  role: string | null;
  rating: number;
  kills: number;
  winrate: number;
  photo_url: string | null;
};

type FilterTab = "ALL" | "CONFIRMED" | "RUMOUR" | "PENDING";

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

function statusColor(status: string) {
  if (status === "Confirmed") return "bg-fn-green/20 text-fn-green border-fn-green/30";
  if (status === "Rumour")    return "bg-fn-yellow/20 text-fn-yellow border-fn-yellow/30";
  return "bg-fn-muted/20 text-fn-muted border-fn-gborder";
}

export default function TransferWindowPage() {
  const countdown = useCountdown(8, 14, 22);
  const [transfers, setTransfers]   = useState<Transfer[]>([]);
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    const [tr, fa] = await Promise.all([
      fetch("/api/transfers"),
      fetch("/api/athletes?status=Free+Agent"),
    ]);
    if (tr.ok) setTransfers(await tr.json());
    if (fa.ok) setFreeAgents(await fa.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filters: FilterTab[] = ["ALL", "CONFIRMED", "RUMOUR", "PENDING"];

  const filtered = activeFilter === "ALL"
    ? transfers
    : transfers.filter((t) => t.status.toUpperCase() === activeFilter);

  const fmtFee = (fee: number | null) =>
    fee ? `₦${Number(fee).toLocaleString()}` : "—";

  const totalValue = transfers.reduce((sum, t) => sum + (t.fee ?? 0), 0);

  return (
    <div className="min-h-screen">
      {/* Header with countdown */}
      <div className="px-4 sm:px-8 lg:px-12 py-8 border-b border-fn-gborder bg-fn-card/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="fn-label mb-1">CONTRACT ANALYSIS</div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-fn-text tracking-tight">
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
                  <span className="text-fn-yellow text-3xl sm:text-4xl tabular-nums"
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

              <div className="fn-label mb-3">RECENT TRANSFERS</div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-fn-card rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="border-b border-fn-gborder">
                        {["Player", "From", "To", "Fee", "Status", "Date"].map((h) => (
                          <th key={h} className="fn-label pb-3 text-left pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-fn-muted text-[10px]">
                            No transfers match this filter
                          </td>
                        </tr>
                      ) : (
                        filtered.map((t) => {
                          const playerTag = t.athletes?.ign || t.athletes?.name || "—";
                          return (
                            <tr key={t.id} className="border-b border-fn-gborder/50 hover:bg-fn-card/50 transition-colors">
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-fn-green/15 border border-fn-gborder flex items-center justify-center text-[10px] font-bold text-fn-green">
                                    {playerTag[0]}
                                  </div>
                                  <span className="text-[11px] font-bold text-fn-text">{playerTag}</span>
                                </div>
                              </td>
                              <td className="py-3.5 pr-4 text-[10px] text-fn-muted">{t.from_team || "—"}</td>
                              <td className="py-3.5 pr-4 text-[10px] text-fn-text font-bold">{t.to_team || "—"}</td>
                              <td className="py-3.5 pr-4 text-[10px] text-fn-yellow font-bold">{fmtFee(t.fee)}</td>
                              <td className="py-3.5 pr-4">
                                <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border ${statusColor(t.status)}`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-[10px] text-fn-muted">
                                {t.date ? new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Free agents */}
            <div>
              <div className="fn-label mb-3 flex items-center justify-between">
                UNRESTRICTED FREE AGENTS
                <span className="text-fn-muted text-[9px]">{freeAgents.length} AVAILABLE</span>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-fn-card rounded animate-pulse" />)}
                </div>
              ) : freeAgents.length === 0 ? (
                <p className="text-fn-muted text-[10px] py-4">No free agents listed at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {freeAgents.map((agent) => (
                    <div key={agent.id} className="bg-fn-card border border-fn-gborder rounded-sm p-4 hover:border-fn-green/40 transition-all group">
                      <div className="w-14 h-14 rounded-sm bg-fn-green/10 border border-fn-gborder flex items-center justify-center mb-3 group-hover:border-fn-green/40 transition-colors overflow-hidden">
                        {agent.photo_url
                          ? <img src={agent.photo_url} alt={agent.ign} className="w-full h-full object-cover" />
                          : <span className="font-display text-2xl font-black text-fn-green">{agent.ign[0]}</span>}
                      </div>
                      <div className="text-[8px] font-bold text-fn-yellow tracking-widest uppercase mb-1">FREE AGENT</div>
                      <div className="text-xs font-bold text-fn-text mb-0.5">{agent.ign}</div>
                      <div className="fn-label mb-3">{agent.role || "Player"}</div>

                      <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                        {[
                          { v: agent.kills,             l: "KILLS" },
                          { v: `${agent.winrate}%`,     l: "W/R"   },
                          { v: agent.rating.toFixed(1), l: "RTG"   },
                        ].map(({ v, l }) => (
                          <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-1.5">
                            <div className="text-[10px] font-bold text-fn-text">{v}</div>
                            <div className="fn-label text-[7px]">{l}</div>
                          </div>
                        ))}
                      </div>
                      <button className="fn-btn w-full text-[9px] py-2">PROPOSE CONTRACT</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            {/* Window stats */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3">WINDOW STATS</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: loading ? "…" : `₦${totalValue.toLocaleString()}`,                                           l: "Total Value"  },
                  { v: loading ? "…" : String(transfers.length),                                                     l: "Total Moves"  },
                  { v: loading ? "…" : String(transfers.filter((t) => t.status === "Confirmed").length),             l: "Confirmed"    },
                  { v: loading ? "…" : String(freeAgents.length),                                                    l: "Free Agents"  },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-2.5 text-center">
                    <div className="text-xs font-bold text-fn-green">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={12} className="text-fn-green" />
                <span className="fn-label text-fn-green">RECENT ACTIVITY</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-fn-dark rounded animate-pulse" />)}
                </div>
              ) : transfers.slice(0, 5).length === 0 ? (
                <p className="text-fn-muted text-[9px]">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {transfers.slice(0, 5).map((t) => {
                    const player = t.athletes?.ign || t.athletes?.name || "Unknown";
                    const isConfirmed = t.status === "Confirmed";
                    return (
                      <div key={t.id} className="flex gap-2.5 pb-3 border-b border-fn-gborder/50 last:border-0 last:pb-0">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isConfirmed ? "bg-fn-green" : "bg-fn-yellow animate-pulse"}`} />
                        <div>
                          <p className="text-[9px] text-fn-text leading-relaxed">
                            {player}{t.from_team ? ` from ${t.from_team}` : ""}{t.to_team ? ` → ${t.to_team}` : ""}
                          </p>
                          <span className="text-[8px] text-fn-muted">{t.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="bg-fn-card border border-fn-green/30 rounded-sm p-4">
              <div className="fn-label text-fn-green mb-2 flex items-center gap-1.5">
                <Users size={9} /> JOIN WAGER
              </div>
              <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
                Predict transfer outcomes and player signings. Earn rewards for accurate calls.
              </p>
              <button className="fn-btn w-full text-[10px]">JOIN WAGER NOW</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
