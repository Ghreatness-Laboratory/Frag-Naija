"use client";
import { useState, useEffect, useCallback } from "react";
import { Clock, TrendingUp, Users, Filter, Flame } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent, type DummyTransfer } from "@/lib/game-content";

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

export default function TransferWindowPage() {
  const { selectedGame, isHydrated } = useGame();
  const countdown = useCountdown(8, 14, 22);
  const [apiTransfers, setApiTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const primary   = selectedGame.colors.primary;
  const secondary = selectedGame.colors.secondary;
  const isFF      = selectedGame.slug === 'free-fire';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transfers");
    if (res.ok) setApiTransfers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const gameContent = isHydrated ? getGameContent(selectedGame.slug) : null;
  const transfers: Transfer[] = apiTransfers.length > 0
    ? apiTransfers
    : (gameContent?.transfers as Transfer[] | undefined) ?? [];

  const filters: FilterTab[] = ["ALL", "CONFIRMED", "RUMOUR", "PENDING"];
  const filtered = activeFilter === "ALL"
    ? transfers
    : transfers.filter((t) => t.status.toUpperCase() === activeFilter);

  const fmtFee = (fee: number | null) =>
    fee ? `₦${Number(fee).toLocaleString()}` : "—";

  const totalValue = transfers.reduce((sum, t) => sum + (t.fee ?? 0), 0);

  function statusStyle(status: string) {
    if (status === "Confirmed") return { background: `${primary}20`, color: primary, borderColor: `${primary}40` };
    if (status === "Rumour")    return { background: '#f0c04020', color: '#f0c040', borderColor: '#f0c04040' };
    return { background: '#ffffff10', color: '#888', borderColor: '#333' };
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="px-4 sm:px-8 lg:px-12 py-8 border-b border-fn-gborder relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}06 0%, #000 60%)` }}
      >
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isFF && <Flame size={10} style={{ color: primary }} />}
              <span
                className="text-[8px] font-bold tracking-widest uppercase px-2 py-1 border"
                style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
              >
                {selectedGame.shortName.toUpperCase()} — CONTRACT ANALYSIS
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-fn-text tracking-tight mt-2">
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
                  <span
                    className="text-3xl sm:text-4xl tabular-nums"
                    style={{ minWidth: "2ch", display: "inline-block", textAlign: "center", color: secondary }}
                  >
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
                    className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase rounded-sm transition-all border"
                    style={activeFilter === f
                      ? { background: primary, color: '#000', borderColor: primary }
                      : { background: 'transparent', color: '#666', borderColor: '#222' }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="fn-label mb-3">RECENT TRANSFERS — {selectedGame.shortName.toUpperCase()}</div>
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
                        filtered.map((tr) => {
                          const playerTag = tr.athletes?.ign || tr.athletes?.name || "—";
                          return (
                            <tr key={tr.id} className="border-b border-fn-gborder/50 hover:bg-fn-card/50 transition-colors">
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 border flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: `${primary}15`, borderColor: `${primary}30`, color: primary }}
                                  >
                                    {playerTag[0]}
                                  </div>
                                  <span className="text-[11px] font-bold text-fn-text">{playerTag}</span>
                                </div>
                              </td>
                              <td className="py-3.5 pr-4 text-[10px] text-fn-muted">{tr.from_team || "—"}</td>
                              <td className="py-3.5 pr-4 text-[10px] text-fn-text font-bold">{tr.to_team || "—"}</td>
                              <td className="py-3.5 pr-4 text-[10px] font-bold" style={{ color: secondary }}>{fmtFee(tr.fee)}</td>
                              <td className="py-3.5 pr-4">
                                <span
                                  className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border"
                                  style={statusStyle(tr.status)}
                                >
                                  {tr.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-[10px] text-fn-muted">
                                {tr.date ? new Date(tr.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
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

            {/* Transfer notes */}
            {!loading && filtered.some(t => t.notes) && (
              <div>
                <div className="fn-label mb-3">TRANSFER NOTES</div>
                <div className="space-y-3">
                  {filtered.filter(t => t.notes).map((tr) => (
                    <div key={tr.id} className="bg-fn-card border border-fn-gborder rounded-sm p-4"
                      style={{ borderColor: tr.status === 'Confirmed' ? `${primary}20` : '#222' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold" style={{ color: primary }}>{tr.athletes?.ign || "—"}</span>
                        <span className="text-fn-muted text-[8px]">·</span>
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 border"
                          style={statusStyle(tr.status)}
                        >
                          {tr.status}
                        </span>
                      </div>
                      <p className="text-fn-muted text-[10px] leading-relaxed">{tr.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            {/* Window stats */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3">WINDOW STATS</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: loading ? "…" : `₦${totalValue.toLocaleString()}`,                                              l: "Total Value"  },
                  { v: loading ? "…" : String(transfers.length),                                                        l: "Total Moves"  },
                  { v: loading ? "…" : String(transfers.filter((t) => t.status === "Confirmed").length),                l: "Confirmed"    },
                  { v: loading ? "…" : String(transfers.filter((t) => t.status === "Rumour").length),                   l: "Rumours"      },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-2.5 text-center">
                    <div className="text-xs font-bold" style={{ color: primary }}>{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={12} style={{ color: primary }} />
                <span className="fn-label" style={{ color: primary }}>RECENT ACTIVITY</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-fn-dark rounded animate-pulse" />)}
                </div>
              ) : transfers.slice(0, 5).length === 0 ? (
                <p className="text-fn-muted text-[9px]">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {transfers.slice(0, 5).map((tr) => {
                    const player = tr.athletes?.ign || tr.athletes?.name || "Unknown";
                    const isConfirmed = tr.status === "Confirmed";
                    return (
                      <div key={tr.id} className="flex gap-2.5 pb-3 border-b border-fn-gborder/50 last:border-0 last:pb-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!isConfirmed ? "animate-pulse" : ""}`}
                          style={{ background: isConfirmed ? primary : '#f0c040' }}
                        />
                        <div>
                          <p className="text-[9px] text-fn-text leading-relaxed">
                            {player}{tr.from_team ? ` from ${tr.from_team}` : ""}{tr.to_team ? ` → ${tr.to_team}` : ""}
                          </p>
                          <span className="text-[8px] text-fn-muted">{tr.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              className="bg-fn-card border rounded-sm p-4"
              style={{ borderColor: `${primary}30` }}
            >
              <div className="fn-label mb-2 flex items-center gap-1.5" style={{ color: primary }}>
                <Users size={9} /> JOIN WAGER
              </div>
              <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
                Predict transfer outcomes and player signings. Earn rewards for accurate calls.
              </p>
              <button
                className="w-full text-[10px] py-2 font-bold tracking-widest uppercase border rounded-sm transition-all"
                style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
              >
                JOIN WAGER NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
