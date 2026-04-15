"use client";
import { useState, useEffect, useCallback } from "react";
import { Trophy, Users, ChevronRight } from "lucide-react";

type Tournament = {
  id: string;
  name: string;
  game: string;
  prize_pool: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  format: string | null;
  region: string;
  image_url: string | null;
};

function fmtPrize(amount: number | null, currency: string) {
  if (!amount) return "TBA";
  return `₦${Number(amount).toLocaleString()}`;
}

function statusBadge(status: string) {
  if (status === "Live")      return "bg-fn-red/20 text-fn-red border-fn-red/30 animate-pulse";
  if (status === "Completed") return "bg-fn-muted/20 text-fn-muted border-fn-gborder";
  return "bg-fn-green/20 text-fn-green border-fn-gborder";
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"all" | "live" | "upcoming" | "completed">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tournaments");
    if (res.ok) setTournaments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = activeTab === "all"
    ? tournaments
    : tournaments.filter((t) => t.status.toLowerCase() === activeTab);

  const live      = tournaments.filter((t) => t.status === "Live");
  const upcoming  = tournaments.filter((t) => t.status === "Upcoming");
  const completed = tournaments.filter((t) => t.status === "Completed");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-fn-card2 to-fn-dark border-b border-fn-gborder px-4 sm:px-8 lg:px-12 py-8 sm:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-40 pointer-events-none" />
        <div className="absolute top-4 right-4 w-24 h-24 border border-fn-green/10 rounded-full pointer-events-none" />
        <div className="absolute top-8 right-8 w-12 h-12 border border-fn-green/20 rounded-full pointer-events-none" />

        <div className="relative max-w-4xl">
          <span className="inline-block text-[8px] font-bold tracking-widest uppercase bg-fn-green/20 text-fn-green border border-fn-gborder px-2 py-1 mb-3">
            {live.length > 0 ? `● ${live.length} LIVE` : "● TOURNAMENTS"}
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase text-fn-text tracking-tight leading-none mb-2">
            TOURNAMENTS
          </h1>
          <p className="text-fn-muted text-xs tracking-wider mb-6">
            Compete, watch and claim glory in the most prestigious Nigerian esports circuits.
          </p>

          {/* Summary stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { v: tournaments.length, l: "Total"     },
              { v: live.length,        l: "Live Now"  },
              { v: upcoming.length,    l: "Upcoming"  },
              { v: completed.length,   l: "Completed" },
            ].map(({ v, l }) => (
              <div key={l} className="bg-fn-card border border-fn-gborder rounded-sm px-4 py-2 text-center min-w-[70px]">
                <div className="font-display text-xl font-black text-fn-green">{loading ? "…" : v}</div>
                <div className="fn-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 border-b border-fn-gborder">
          {(["all", "live", "upcoming", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-fn-green text-fn-green"
                  : "border-transparent text-fn-muted hover:text-fn-text"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tournament list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-fn-card rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 text-fn-muted mx-auto mb-3" />
            <p className="text-fn-muted text-sm uppercase tracking-widest">No tournaments yet</p>
            <p className="text-fn-muted text-xs mt-1">Tournaments added in the admin panel will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div key={t.id} className="bg-fn-card border border-fn-gborder rounded-sm p-5 hover:border-fn-green/40 transition-all group">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border ${statusBadge(t.status)}`}>
                    {t.status === "Live" ? "● " : ""}{t.status}
                  </span>
                  <span className="fn-label">{t.game}</span>
                </div>

                {/* Name */}
                <h3 className="font-display text-lg font-black uppercase text-fn-text leading-tight mb-1 group-hover:text-fn-green transition-colors">
                  {t.name}
                </h3>
                <p className="fn-label mb-4">{t.region}{t.format ? ` · ${t.format}` : ""}</p>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-fn-dark border border-fn-gborder rounded-sm p-2 text-center">
                    <div className="text-xs font-bold text-fn-green">{fmtPrize(t.prize_pool, t.currency)}</div>
                    <div className="fn-label">Prize Pool</div>
                  </div>
                  <div className="bg-fn-dark border border-fn-gborder rounded-sm p-2 text-center">
                    <div className="text-xs font-bold text-fn-text">
                      {t.start_date
                        ? new Date(t.start_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
                        : "TBA"}
                    </div>
                    <div className="fn-label">Start Date</div>
                  </div>
                </div>

                <button className="fn-btn-ghost text-[9px] flex items-center gap-1 w-full justify-center border border-fn-gborder py-2">
                  VIEW DETAILS <ChevronRight size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
