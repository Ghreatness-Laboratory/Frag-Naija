"use client";
import { useState, useEffect, useCallback } from "react";
import { Trophy, Users, Shield, ChevronRight, Star, Target } from "lucide-react";

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

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-fn-yellow/20 text-fn-yellow border-fn-yellow/50",
    2: "bg-fn-text/20 text-fn-text border-fn-gborder",
    3: "bg-fn-amber/20 text-fn-amber border-fn-amber/50",
  };
  const cls = colors[rank] ?? "bg-fn-card text-fn-muted border-fn-gborder";
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border text-[11px] font-black font-display ${cls}`}>
      {rank}
    </span>
  );
}

function StrengthBar({ value }: { value: number }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  const color = pct >= 80 ? "#00ff41" : pct >= 60 ? "#f0c040" : "#ff4141";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="fn-label">TEAM STRENGTH</span>
        <span className="text-[10px] font-bold font-mono" style={{ color }}>{pct}</span>
      </div>
      <div className="h-1.5 bg-fn-dark rounded-sm overflow-hidden">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }} />
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teams", { cache: "no-store" });
    if (res.ok) {
      const data: Team[] = await res.json();
      // Sort by rank (nulls last), then by wins
      const sorted = [...data].sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank;
        if (a.rank != null) return -1;
        if (b.rank != null) return 1;
        return b.wins - a.wins;
      });
      setTeams(sorted);
      if (sorted.length > 0) setSelected(sorted[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fn-black">
        <div className="w-6 h-6 border-2 border-fn-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fn-black gap-4">
        <Shield className="w-12 h-12 text-fn-muted" />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No teams yet</p>
      </div>
    );
  }

  const t = selected!;
  const achievements = parseArray(t.achievements);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Power Rankings */}
      <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        <div className="p-4 border-b border-fn-gborder">
          <div className="fn-label mb-0.5 flex items-center gap-1.5">
            <Trophy size={9} className="text-fn-yellow" /> POWER RANKINGS
          </div>
          <h1 className="font-display text-xl font-black uppercase text-fn-text">LEADERBOARD</h1>
        </div>

        <div className="overflow-y-auto max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-10rem)]">
          {teams.map((team, idx) => {
            const rank = team.rank ?? idx + 1;
            const isActive = selected?.id === team.id;
            const wr = winRate(team.wins, team.losses);
            return (
              <button
                key={team.id}
                onClick={() => setSelected(team)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-fn-gborder/50 transition-all text-left ${
                  isActive ? "bg-fn-green/10 border-l-2 border-l-fn-green" : "hover:bg-fn-card/50 border-l-2 border-l-transparent"
                }`}
              >
                <RankBadge rank={rank} />

                <div className={`w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden border ${
                  isActive ? "border-fn-green/40" : "border-fn-gborder"
                }`}>
                  {team.logo_url
                    ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    : <span className="font-display text-sm font-black text-fn-green">{team.name[0]}</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate text-fn-text">{team.name}</div>
                  <div className="fn-label truncate">{team.region || "Nigeria"}</div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] font-bold font-mono text-fn-green">{wr}%</div>
                  <div className="fn-label text-[7px]">WIN</div>
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
          <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-sm border-2 border-fn-green flex items-center justify-center glow-green flex-shrink-0 overflow-hidden bg-fn-green/10`}>
                {t.logo_url
                  ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                  : <span className="font-display text-4xl font-black text-fn-green">{t.name[0]}</span>}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {t.rank != null && <RankBadge rank={t.rank} />}
                  {t.region && <span className="text-[9px] text-fn-muted font-bold tracking-widest border border-fn-gborder px-2 py-0.5">{t.region}</span>}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-fn-text tracking-wide">{t.name}</h2>
                <div className="flex gap-4 mt-2">
                  {[
                    { v: t.wins,   l: "WINS"   },
                    { v: t.losses, l: "LOSSES"  },
                    { v: `${winRate(t.wins, t.losses)}%`, l: "WIN RATE" },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center">
                      <div className="font-display text-xl font-black text-fn-text">{v}</div>
                      <div className="fn-label">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rank badge large */}
              <div className="flex-shrink-0 text-center">
                <div className="text-[9px] text-fn-muted uppercase tracking-widest mb-1">RANK</div>
                <div className="font-display text-5xl font-black text-fn-yellow">
                  #{t.rank ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Strength + Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">LEADERBOARD POSITION</div>
              <div className="font-display text-3xl font-black text-fn-yellow">#{t.rank ?? "—"}</div>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">TOTAL WINS</div>
              <div className="font-display text-3xl font-black text-fn-green">{t.wins}</div>
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-1">WIN RATE</div>
              <div className="font-display text-3xl font-black text-fn-text">{winRate(t.wins, t.losses)}%</div>
            </div>
          </div>

          {/* Team Strength */}
          {t.strength != null && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 mb-4">
              <StrengthBar value={t.strength} />
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 mb-4">
              <div className="fn-label mb-3 flex items-center gap-1.5">
                <Trophy size={9} className="text-fn-yellow" /> ACHIEVEMENTS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {achievements.map((ach) => (
                  <div key={ach} className="flex items-center gap-2 p-2 bg-fn-dark border border-fn-gborder rounded-sm">
                    <Star size={10} className="text-fn-yellow flex-shrink-0" />
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
                <Users size={9} className="text-fn-green" /> ACTIVE ROSTER — {t.players.length} PLAYERS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {t.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm hover:border-fn-green/30 transition-colors">
                    <div className="w-8 h-8 rounded-sm bg-fn-green/15 border border-fn-gborder flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.ign} className="w-full h-full object-cover" />
                        : <span className="font-display text-sm font-black text-fn-green">{p.ign[0]}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-fn-text truncate">{p.ign}</div>
                      <div className="fn-label truncate">{p.role || "Player"}</div>
                    </div>
                    <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                      p.status === "Active" ? "bg-fn-green/20 text-fn-green" : "bg-fn-muted/20 text-fn-muted"
                    }`}>{p.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {t.bio && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="fn-label mb-3">TEAM BIO</div>
              <p className="text-fn-muted text-[11px] leading-relaxed">{t.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
