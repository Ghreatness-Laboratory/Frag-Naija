"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Shield, Star, Flame, Search } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent } from "@/lib/game-content";
import { DEFAULT_GAME } from "@/lib/games";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  role: string | null;
  overall_rating: number;
  photo_url: string | null;
  status: string;
};

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  region: string | null;
  wins: number;
  losses: number;
  kills: number;
  bio: string | null;
  rank: number | null;
  strength: number | null;
  achievements: string[] | string | null;
  players: Athlete[];
  game_slug?: string | null;
  total_ranking_points?: number;
  power_rank?: number;
};

function parseArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { const p = JSON.parse(String(val)); return Array.isArray(p) ? p.filter(Boolean) : []; }
  catch { return String(val).split(",").map((s) => s.trim()).filter(Boolean); }
}

function winRate(wins: number, losses: number) {
  const total = wins + losses;
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}

export default function TeamsPage() {
  const router = useRouter();
  const { selectedGame, isHydrated } = useGame();
  const [apiTeams, setApiTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch] = useState("");

  const activeGame = selectedGame ?? DEFAULT_GAME;
  const primary   = activeGame.colors.primary;
  const secondary = activeGame.colors.secondary;
  const isFF      = activeGame.slug === 'free-fire';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/teams?game_slug=${activeGame.slug}`, { cache: "no-store" });
    if (res.ok) setApiTeams(await res.json());
    setLoading(false);
  }, [activeGame.slug]);

  useEffect(() => { load(); }, [load]);

  const gameContent = isHydrated ? getGameContent(activeGame.slug) : null;
  const apiForGame = apiTeams.filter((t) => (t.game_slug ?? activeGame.slug) === activeGame.slug);
  const gameTeams: Team[] = apiForGame.length > 0
    ? apiForGame
    : (gameContent?.teams as Team[] | undefined) ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const teams = normalizedSearch
    ? gameTeams.filter((t) => t.name.toLowerCase().includes(normalizedSearch))
    : gameTeams;

  useEffect(() => {
    if (teams.length > 0) {
      const current = selected ? teams.find(t => t.id === selected.id) : null;
      setSelected(current ?? teams[0]);
    }
  }, [teams.length, activeGame.slug, normalizedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${primary} transparent transparent transparent` }} />
      </div>
    );
  }

  if (gameTeams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12" style={{ color: primary }} />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No {activeGame.shortName} teams yet</p>
      </div>
    );
  }

  const t = selected ?? teams[0];
  const achievements = parseArray(t.achievements);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Power Rankings */}
      <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        <div
          className="p-4 border-b border-fn-gborder"
          style={{ background: `linear-gradient(135deg, ${primary}06 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            {isFF && <Flame size={10} style={{ color: primary }} />}
            <div className="fn-label flex items-center gap-1.5">
              <Trophy size={9} style={{ color: secondary }} /> POWER RANKINGS
            </div>
          </div>
          <h1 className="font-display text-xl font-black uppercase text-fn-text">LEADERBOARD</h1>
          <div className="mt-2">
            <span
              className="text-[9px] font-bold px-2 py-1 tracking-widest uppercase border"
              style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
            >
              {teams.length} {activeGame.shortName.toUpperCase()} TEAMS
            </span>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-sm border border-fn-gborder bg-fn-black/70 px-3 py-2 focus-within:border-fn-green/60">
            <Search size={13} style={{ color: primary }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams"
              className="w-full bg-transparent text-xs text-fn-text outline-none placeholder:text-fn-muted"
            />
          </label>
        </div>

        <div className="overflow-y-auto max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-15rem)]">
          {teams.length === 0 ? (
            <p className="px-4 py-6 text-[10px] uppercase tracking-widest text-fn-muted">No results found for &quot;{search}&quot;</p>
          ) : teams.map((team, idx) => {
            const rank = team.power_rank ?? idx + 1;
            const isActive = (selected?.id ?? teams[0].id) === team.id;
            const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? secondary : 'rgb(var(--fn-muted))';
            return (
              <button
                key={team.id}
                onClick={() => router.push(`/teams/${team.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-fn-gborder/50 transition-all text-left"
                style={isActive
                  ? { background: `${primary}10`, borderLeft: `2px solid ${primary}` }
                  : { borderLeft: '2px solid transparent' }}
              >
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-sm border text-[11px] font-black font-display flex-shrink-0"
                  style={{ color: rankColor, borderColor: `${rankColor}50`, background: `${rankColor}15` }}
                >
                  {rank}
                </span>

                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden border"
                  style={isActive
                    ? { borderColor: `${primary}40`, background: `${primary}15` }
                    : { borderColor: 'rgb(var(--fn-gborder))', background: 'rgb(var(--fn-card))' }}
                >
                  {team.logo_url
                    ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    : <span className="font-display text-sm font-black" style={{ color: primary }}>{team.name[0]}</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate text-fn-text">{team.name}</div>
                  <div className="fn-label truncate">{team.region || "Nigeria"}</div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] font-bold font-mono" style={{ color: primary }}>{Number(team.total_ranking_points ?? 0).toFixed(0)}</div>
                  <div className="fn-label text-[7px]">PTS</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Team Detail */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          {/* Team header */}
          <div
            className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 mb-4"
            style={{ background: `linear-gradient(135deg, ${primary}06 0%, rgb(var(--fn-black)) 60%)` }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm border-2 flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ borderColor: primary, background: `${primary}15`, boxShadow: `0 0 20px ${primary}25` }}
              >
                {t.logo_url
                  ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                  : <span className="font-display text-4xl font-black" style={{ color: primary }}>{t.name[0]}</span>}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {t.rank != null && (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-sm border text-[11px] font-black font-display"
                      style={{
                        color: t.rank === 1 ? '#FFD700' : t.rank === 2 ? '#C0C0C0' : t.rank === 3 ? secondary : 'rgb(var(--fn-muted))',
                        borderColor: t.rank === 1 ? '#FFD70050' : 'rgb(var(--fn-gborder) / 0.7)',
                        background: t.rank === 1 ? '#FFD70015' : 'rgb(var(--fn-card2) / 0.55)',
                      }}
                    >
                      {t.rank}
                    </span>
                  )}
                  {t.region && (
                    <span className="text-[9px] text-fn-muted font-bold tracking-widest border border-fn-gborder px-2 py-0.5">{t.region}</span>
                  )}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-fn-text tracking-wide">{t.name}</h2>
                <div className="flex gap-4 mt-2">
                  {[
                    { v: Number(t.total_ranking_points ?? 0).toFixed(0), l: "RANK PTS" },
                    { v: t.wins,   l: "WINS"     },
                    { v: t.losses, l: "LOSSES"    },
                    { v: `${winRate(t.wins, t.losses)}%`, l: "WIN RATE" },
                    { v: t.kills,  l: "KILLS"     },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center">
                      <div className="font-display text-xl font-black text-fn-text">{v}</div>
                      <div className="fn-label">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="text-[9px] text-fn-muted uppercase tracking-widest mb-1">RANK</div>
                <div className="font-display text-5xl font-black" style={{ color: secondary }}>
                  #{t.rank ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">LEADERBOARD POSITION</div>
              <div className="font-display text-3xl font-black" style={{ color: secondary }}>#{t.rank ?? "—"}</div>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">TOTAL WINS</div>
              <div className="font-display text-3xl font-black" style={{ color: primary }}>{t.wins}</div>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">WIN RATE</div>
              <div className="font-display text-3xl font-black text-fn-text">{winRate(t.wins, t.losses)}%</div>
            </div>
          </div>

          {/* Team Strength bar */}
          {t.strength != null && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="fn-label">TEAM STRENGTH</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: primary }}>{t.strength}</span>
              </div>
              <div className="h-2 bg-fn-dark rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${t.strength}%`,
                    background: `linear-gradient(90deg, ${primary}66, ${primary})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 mb-4">
              <div className="fn-label mb-3 flex items-center gap-1.5">
                <Trophy size={9} style={{ color: secondary }} /> ACHIEVEMENTS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {achievements.map((ach) => (
                  <div key={ach} className="flex items-center gap-2 p-2 bg-fn-dark border border-fn-gborder rounded-sm">
                    <Star size={10} style={{ color: secondary }} className="flex-shrink-0" />
                    <span className="text-[10px] text-fn-text">{ach}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roster */}
          {t.players && t.players.length > 0 && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 mb-4">
              <div className="fn-label mb-3 flex items-center gap-1.5">
                <Users size={9} style={{ color: primary }} /> ACTIVE ROSTER — {t.players.length} PLAYERS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {t.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${primary}40`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                  >
                    <div
                      className="w-8 h-8 rounded-sm border flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ background: `${primary}15`, borderColor: `${primary}30` }}
                    >
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.ign} className="w-full h-full object-cover" />
                        : <span className="font-display text-sm font-black" style={{ color: primary }}>{p.ign[0]}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-fn-text truncate">{p.ign}</div>
                      <div className="fn-label truncate">{p.role || "Player"}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm"
                        style={p.status === "Active"
                          ? { background: `${primary}20`, color: primary }
                          : { background: 'rgb(var(--fn-card2) / 0.75)', color: 'rgb(var(--fn-muted))' }}>
                        {p.status}
                      </div>
                      {p.overall_rating > 0 && (
                        <div className="text-[9px] font-bold font-mono" style={{ color: secondary }}>{p.overall_rating}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {t.bio && (
            <div
              className="bg-fn-card border border-fn-gborder rounded-sm p-4"
              style={{ borderColor: `${primary}20` }}
            >
              <div className="fn-label mb-3" style={{ color: primary }}>TEAM BIO</div>
              <p className="text-fn-muted text-[11px] leading-relaxed">{t.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
