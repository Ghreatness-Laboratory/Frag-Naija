"use client";
import { useState, useEffect, useCallback } from "react";
import { Trophy, ChevronRight, Flame } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent, type DummyTournament } from "@/lib/game-content";

type Tournament = {
  id: string; name: string; game: string; prize_pool: number | null;
  currency: string; start_date: string | null; end_date: string | null;
  status: string; format: string | null; region: string; image_url: string | null;
};

function fmtPrize(amount: number | null, _currency: string) {
  if (!amount) return "TBA";
  return `₦${Number(amount).toLocaleString()}`;
}

function statusBadge(status: string, primary: string) {
  if (status === "Live")      return { cls: "animate-pulse", style: { background: `${primary}22`, color: primary, border: `1px solid ${primary}55` } };
  if (status === "Completed") return { cls: "", style: { background: "#ffffff11", color: "#888", border: "1px solid #333" } };
  return { cls: "", style: { background: "#00ff4115", color: "#00ff41", border: "1px solid #00ff4130" } };
}

export default function TournamentsPage() {
  const { selectedGame, isHydrated } = useGame();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"all" | "live" | "upcoming" | "completed">("all");

  const primary = selectedGame.colors.primary;
  const isFF    = selectedGame.slug === 'free-fire';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tournaments");
    if (res.ok) {
      const data: Tournament[] = await res.json();
      setTournaments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const gameContent = isHydrated ? getGameContent(selectedGame.slug) : null;
  const apiForGame  = tournaments.filter(
    (t) => t.game?.toLowerCase().includes(selectedGame.name.toLowerCase().split(' ')[0])
  );
  const displayed: Tournament[] = apiForGame.length > 0
    ? apiForGame
    : (gameContent?.tournaments as Tournament[] | undefined) ?? [];

  const all       = displayed;
  const live      = displayed.filter((t) => t.status === "Live");
  const upcoming  = displayed.filter((t) => t.status === "Upcoming");
  const completed = displayed.filter((t) => t.status === "Completed");

  const filtered = activeTab === "all" ? all
    : activeTab === "live"      ? live
    : activeTab === "upcoming"  ? upcoming
    : completed;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative border-b px-4 sm:px-8 lg:px-12 py-8 sm:py-12 overflow-hidden"
        style={{ borderColor: `${primary}30`, background: `linear-gradient(135deg, ${primary}08 0%, #000 60%)` }}
      >
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-30 pointer-events-none" />
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full pointer-events-none" style={{ border: `1px solid ${primary}18` }} />
        <div className="absolute top-8 right-8 w-12 h-12 rounded-full pointer-events-none" style={{ border: `1px solid ${primary}30` }} />

        <div className="relative max-w-4xl">
          <div className="flex items-center gap-2 mb-3">
            {isFF && <Flame size={12} style={{ color: primary }} />}
            <span
              className="inline-block text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm"
              style={{ background: `${primary}20`, color: primary, border: `1px solid ${primary}40` }}
            >
              {live.length > 0 ? `● ${live.length} LIVE` : "● TOURNAMENTS"} — {selectedGame.shortName.toUpperCase()}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none mb-2 text-fn-text">
            TOURNAMENTS
          </h1>
          <p className="text-fn-muted text-xs tracking-wider mb-6">
            {isFF
              ? "Compete on Bermuda, Purgatory & Kalahari — Nigeria's fiercest Free Fire circuits."
              : `${selectedGame.name} tournaments across Nigeria. Compete, watch, and claim glory.`}
          </p>

          <div className="flex flex-wrap gap-3">
            {[
              { v: all.length, l: "Total" },
              { v: live.length, l: "Live Now" },
              { v: upcoming.length, l: "Upcoming" },
              { v: completed.length, l: "Completed" },
            ].map(({ v, l }) => (
              <div key={l} className="bg-fn-card border border-fn-gborder rounded-sm px-4 py-2 text-center min-w-[70px]">
                <div className="font-display text-xl font-black" style={{ color: loading ? '#555' : primary }}>
                  {loading ? "…" : v}
                </div>
                <div className="fn-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-fn-gborder">
          {(["all", "live", "upcoming", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 -mb-px"
              style={activeTab === tab
                ? { borderColor: primary, color: primary }
                : { borderColor: 'transparent', color: '#666' }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-24 bg-fn-card rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: primary }} />
            <p className="text-fn-muted text-sm uppercase tracking-widest">No {selectedGame.shortName} tournaments yet</p>
            <p className="text-fn-muted text-xs mt-1">Tournaments added in the admin panel will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const badge = statusBadge(t.status, primary);
              return (
                <div
                  key={t.id}
                  className="bg-fn-card border border-fn-gborder rounded-sm p-5 transition-all group hover:scale-[1.01]"
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${primary}50`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${badge.cls}`} style={badge.style}>
                      {t.status === "Live" ? "● " : ""}{t.status}
                    </span>
                    <span className="fn-label">{t.game}</span>
                  </div>

                  <h3 className="font-display text-lg font-black uppercase text-fn-text leading-tight mb-1">
                    {t.name}
                  </h3>
                  <p className="fn-label mb-4">{t.region}{t.format ? ` · ${t.format}` : ""}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-fn-dark border border-fn-gborder rounded-sm p-2 text-center">
                      <div className="text-xs font-bold" style={{ color: primary }}>{fmtPrize(t.prize_pool, t.currency)}</div>
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

                  <button
                    className="text-[9px] flex items-center gap-1 w-full justify-center border rounded-sm py-2 transition-all font-bold tracking-widest uppercase"
                    style={{ borderColor: `${primary}40`, color: primary }}
                  >
                    VIEW DETAILS <ChevronRight size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
