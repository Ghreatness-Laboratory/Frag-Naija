"use client";
import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Flame, X, Users, CalendarClock, PlayCircle, ClipboardList } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent } from "@/lib/game-content";

type Tournament = {
  id: string; name: string; game: string; prize_pool: number | null;
  currency: string; start_date: string | null; end_date: string | null;
  status: string; format: string | null; region: string; image_url: string | null;
  description?: string | null; rules_overview?: string | null;
  participant_count?: number | null; slot_count?: number | null;
  registration_instructions?: string | null; watch_url?: string | null;
  access_instructions?: string | null; tier?: string | null;
  metadata?: Record<string, unknown> | null;
  tournament_results?: TournamentResult[];
};

function fmtPrize(amount: number | null) {
  if (!amount) return "TBA";
  return `₦${Number(amount).toLocaleString()}`;
}

type TournamentResult = {
  id?: string;
  placement: string;
  points_earned?: number | null;
  team?: { id?: string; name?: string | null; logo_url?: string | null } | null;
};

function fmtDateTime(value: string | null) {
  if (!value) return "TBA";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function resultRank(result: TournamentResult) {
  const n = Number(result.placement);
  return Number.isFinite(n) ? n : 999;
}

function statusLabel(status: string) {
  return status === "Completed" ? "Finished" : status;
}

function statusBadge(status: string, primary: string) {
  if (status === "Live")      return { cls: "animate-pulse", style: { background: `${primary}22`, color: primary, border: `1px solid ${primary}55` } };
  if (status === "Completed") return { cls: "", style: { background: "rgb(var(--fn-card2) / 0.75)", color: "rgb(var(--fn-muted))", border: "1px solid rgb(var(--fn-gborder))" } };
  return { cls: "", style: { background: "rgb(var(--fn-green) / 0.10)", color: "rgb(var(--fn-green))", border: "1px solid rgb(var(--fn-green) / 0.25)" } };
}

export default function TournamentsPage() {
  const { selectedGame, isHydrated } = useGame();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"all" | "live" | "upcoming" | "completed">("all");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const primary = selectedGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const isFF    = selectedGame?.slug === 'free-fire';

  const load = useCallback(async () => {
    if (!selectedGame) {
      setTournaments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/tournaments?game_slug=${selectedGame.slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data: Tournament[] = await res.json();
      setTournaments(data);
    }
    setLoading(false);
  }, [selectedGame]);

  useEffect(() => { load(); }, [load]);

  const gameContent = isHydrated && selectedGame ? getGameContent(selectedGame.slug) : null;
  const apiForGame  = tournaments.filter(
    (t) => selectedGame && t.game?.toLowerCase().includes(selectedGame.name.toLowerCase().split(' ')[0])
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

  async function openDetails(tournament: Tournament) {
    setSelectedTournament(tournament);
    if (!tournament.id || tournament.tournament_results) return;

    const res = await fetch(`/api/tournaments/${tournament.id}`, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const detail = await res.json();
    setSelectedTournament(detail);
    setTournaments((current) => current.map((item) => item.id === tournament.id ? { ...item, ...detail } : item));
  }

  if (!selectedGame) {
    return (
      <div className="min-h-screen px-4 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl rounded-sm border border-fn-gborder bg-fn-card p-8 text-center">
          <Trophy className="mx-auto mb-4 h-10 w-10 text-fn-green" />
          <h1 className="font-display text-3xl font-black uppercase text-fn-text">Select a game to view tournaments</h1>
          <p className="mt-3 text-xs leading-relaxed text-fn-muted">
            Tournament pages are game-scoped. Choose a game first to see live, upcoming, and completed events for that title.
          </p>
          <Link href="/select-game" className="fn-btn mt-6 inline-flex items-center gap-2">
            Select Game <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative border-b px-4 sm:px-8 lg:px-12 py-8 sm:py-12 overflow-hidden"
        style={{ borderColor: `${primary}30`, background: `linear-gradient(135deg, ${primary}08 0%, rgb(var(--fn-black)) 60%)` }}
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
                <div className="font-display text-xl font-black" style={{ color: loading ? 'rgb(var(--fn-muted))' : primary }}>
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
                : { borderColor: 'transparent', color: 'rgb(var(--fn-muted))' }}
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
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openDetails(t)}
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
                      <div className="text-xs font-bold" style={{ color: primary }}>{fmtPrize(t.prize_pool)}</div>
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

                  <span
                    className="text-[9px] flex items-center gap-1 w-full justify-center border rounded-sm py-2 transition-all font-bold tracking-widest uppercase"
                    style={{ borderColor: `${primary}40`, color: primary }}
                  >
                    VIEW DETAILS <ChevronRight size={10} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-fn-gborder bg-fn-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="fn-label" style={{ color: primary }}>{selectedTournament.game || selectedGame.name}</p>
                <h2 className="font-display text-2xl font-black uppercase tracking-widest text-fn-text">{selectedTournament.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-widest text-fn-muted">{selectedTournament.region || "Nigeria"} · {selectedTournament.tier || "local"} · {statusLabel(selectedTournament.status)}</p>
              </div>
              <button type="button" onClick={() => setSelectedTournament(null)} className="rounded border border-fn-gborder p-2 text-fn-muted hover:text-fn-text" aria-label="Close tournament details">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={<CalendarClock size={15} />} label="Start" value={fmtDateTime(selectedTournament.start_date)} />
              <Info icon={<CalendarClock size={15} />} label="End" value={fmtDateTime(selectedTournament.end_date)} />
              <Info icon={<Trophy size={15} />} label="Prize Pool" value={fmtPrize(selectedTournament.prize_pool)} />
              <Info icon={<Users size={15} />} label="Participants / Slots" value={`${selectedTournament.participant_count ?? 0}${selectedTournament.slot_count ? ` / ${selectedTournament.slot_count}` : " registered"}`} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_.9fr]">
              <div className="space-y-4">
                <DetailBlock title="Format / rules overview" icon={<ClipboardList size={15} />}>
                  {selectedTournament.rules_overview || selectedTournament.description || selectedTournament.format || "Rules and format will be announced by the organizers."}
                </DetailBlock>
                {selectedTournament.metadata && Object.keys(selectedTournament.metadata).length > 0 && (
                  <DetailBlock title="Additional metadata">
                    {Object.entries(selectedTournament.metadata).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")}
                  </DetailBlock>
                )}
              </div>

              <div className="space-y-4">
                {selectedTournament.status === "Completed" && (
                  <DetailBlock title="Winners / final standings" icon={<Trophy size={15} />}>
                    {selectedTournament.tournament_results?.length
                      ? <ol className="space-y-2">{[...selectedTournament.tournament_results].sort((a, b) => resultRank(a) - resultRank(b)).map((result) => <li key={result.id ?? `${result.placement}-${result.team?.name}`} className="flex justify-between border border-fn-gborder bg-fn-black px-3 py-2"><span>{result.placement}. {result.team?.name || "Team TBA"}</span><span>{result.points_earned ?? 0} pts</span></li>)}</ol>
                      : "Final standings will appear here once results are recorded."}
                  </DetailBlock>
                )}
                {selectedTournament.status === "Upcoming" && (
                  <DetailBlock title="How to join / register" icon={<Users size={15} />}>
                    {selectedTournament.registration_instructions || "Register from your FragNaija account, confirm your team roster, and watch for admin check-in instructions before start time."}
                  </DetailBlock>
                )}
                {selectedTournament.status === "Live" && (
                  <DetailBlock title="Watch / enter live tournament" icon={<PlayCircle size={15} />}>
                    {selectedTournament.watch_url ? <a className="text-fn-green underline" href={selectedTournament.watch_url} target="_blank" rel="noreferrer">Open live stream</a> : "Live stream details will appear here when available."}
                    <p className="mt-2">{selectedTournament.access_instructions || "Eligible participants should join through the shared room/access code from tournament admins."}</p>
                  </DetailBlock>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-sm border border-fn-gborder bg-fn-black p-3"><div className="mb-1 flex items-center gap-2 text-fn-green">{icon}<span className="fn-label">{label}</span></div><p className="text-sm font-bold text-fn-text">{value}</p></div>;
}

function DetailBlock({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return <section className="rounded-sm border border-fn-gborder bg-fn-black p-4"><h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-fn-text">{icon}{title}</h3><div className="text-sm leading-relaxed text-fn-muted">{children}</div></section>;
}
