"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Users } from "lucide-react";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  role: string | null;
  rating: number;
  kills: number;
  winrate: number;
  photo_url: string | null;
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
  players: Athlete[];
};

const PALETTE = ["#00ff41", "#f0c040", "#ff6b8a", "#00aaff", "#aa44ff", "#ff9933"];

function teamTag(name: string) {
  return name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 3) || name.slice(0, 3).toUpperCase();
}

function winRate(wins: number, losses: number) {
  const total = wins + losses;
  if (!total) return 0;
  return Math.round((wins / total) * 100);
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/teams");
    if (res.ok) {
      const data: Team[] = await res.json();
      setTeams(data);
      if (data.length > 0) setSelected(data[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-fn-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Users className="w-12 h-12 text-fn-muted" />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No teams yet</p>
        <p className="text-fn-muted text-xs">Add teams in the admin panel to see them here.</p>
      </div>
    );
  }

  const t = selected!;
  const tIdx = teams.findIndex((x) => x.id === t.id);
  const col = PALETTE[tIdx % PALETTE.length];
  const tag = teamTag(t.name);
  const wr = winRate(t.wins, t.losses);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-8 lg:px-12 py-8 border-b border-fn-gborder bg-fn-card/20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="fn-label mb-1">SECTOR HIERARCHY</div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-fn-text tracking-tight">
              TACTICAL SQUADS
            </h1>
            <p className="text-fn-muted text-[10px] tracking-wider mt-1">
              Battle Registry — Regional Command Centre
            </p>
          </div>
          <div className="text-right">
            <div className="fn-label mb-0.5">TOTAL SQUADS</div>
            <div className="font-display text-lg font-black text-fn-green">{teams.length}</div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Team selector grid */}
        <div className="mb-8">
          <div className="fn-label mb-4">— SELECT COMMAND</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {teams.map((team, i) => {
              const isActive = team.id === t.id;
              const c = PALETTE[i % PALETTE.length];
              const ttag = teamTag(team.name);
              return (
                <button
                  key={team.id}
                  onClick={() => setSelected(team)}
                  className={`p-3 rounded-sm border transition-all text-left ${
                    isActive
                      ? "border-fn-green bg-fn-green/10 glow-green"
                      : "border-fn-gborder bg-fn-card hover:border-fn-green/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl font-display font-black mb-2 overflow-hidden"
                    style={{ background: `${c}18`, border: `1px solid ${c}30`, color: c }}>
                    {team.logo_url
                      ? <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      : ttag[0]}
                  </div>
                  <div className="text-[10px] font-bold text-fn-text truncate">{team.name}</div>
                  <div className="fn-label">{ttag}</div>
                  <div className="mt-1 text-[9px]" style={{ color: c }}>
                    {winRate(team.wins, team.losses)}% WR
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected team detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team card */}
          <div className="lg:col-span-1">
            <div className="bg-fn-card border rounded-sm p-5" style={{ borderColor: `${col}40` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl font-display font-black overflow-hidden"
                  style={{ background: `${col}18`, border: `2px solid ${col}50`, color: col }}>
                  {t.logo_url
                    ? <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                    : tag[0]}
                </div>
                <div className="text-right">
                  <span className="font-display text-4xl font-black" style={{ color: col }}>#{tIdx + 1}</span>
                </div>
              </div>
              <h2 className="font-display text-2xl font-black uppercase text-fn-text mb-1">{t.name}</h2>
              <p className="fn-label mb-4">{t.region || "Nigeria"}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { v: t.wins,         l: "Wins"     },
                  { v: t.losses,       l: "Losses"   },
                  { v: `${wr}%`,       l: "Win Rate" },
                  { v: t.kills.toLocaleString(), l: "Total Kills" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-2 text-center">
                    <div className="text-xs font-bold text-fn-text">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>

              {/* Win rate bar */}
              <div className="fn-label mb-1">SEASON PERFORMANCE</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${wr}%`, background: col }} />
              </div>

              {t.bio && (
                <p className="text-fn-muted text-[9px] leading-relaxed mt-4 border-t border-fn-gborder pt-3">{t.bio}</p>
              )}
            </div>
          </div>

          {/* Active roster */}
          <div className="lg:col-span-2">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-5">
              <div className="fn-label mb-4">ACTIVE ROSTER — {t.players.length} PLAYERS</div>
              {t.players.length === 0 ? (
                <p className="text-fn-muted text-[10px] py-4 text-center">No players assigned to this team yet.</p>
              ) : (
                <div className="space-y-2">
                  {t.players.map((player, i) => (
                    <div key={player.id} className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm hover:border-fn-green/30 transition-colors">
                      <span className="text-[9px] font-bold text-fn-muted w-4 flex-shrink-0">0{i + 1}</span>
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-display font-black flex-shrink-0 overflow-hidden"
                        style={{ background: `${col}15`, border: `1px solid ${col}30`, color: col }}>
                        {player.photo_url
                          ? <img src={player.photo_url} alt={player.ign} className="w-full h-full object-cover" />
                          : player.ign[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-fn-text">{player.ign}</div>
                        <div className="fn-label">{player.role || "Player"}</div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] font-bold text-fn-text">{player.kills}</div>
                          <div className="fn-label">KILLS</div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] font-bold text-fn-text">{player.winrate}%</div>
                          <div className="fn-label">WR</div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-fn-green" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="fn-label mb-0.5">SECTOR RANKINGS</div>
              <h2 className="font-display text-2xl font-black uppercase text-fn-text">OPERATIONAL LEADERBOARD</h2>
            </div>
            <button className="fn-btn-ghost text-[10px] flex items-center gap-1">
              FULL REPORT <ChevronRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-fn-gborder">
                  {["RANK", "SQUAD", "WINS", "LOSSES", "WIN %", "KILLS", "REGION"].map((h) => (
                    <th key={h} className="fn-label pb-3 text-left pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...teams]
                  .sort((a, b) => winRate(b.wins, b.losses) - winRate(a.wins, a.losses))
                  .map((team, i) => {
                    const c = PALETTE[teams.indexOf(team) % PALETTE.length];
                    const isSelected = team.id === t.id;
                    const wr2 = winRate(team.wins, team.losses);
                    return (
                      <tr
                        key={team.id}
                        className={`border-b border-fn-gborder/40 transition-colors cursor-pointer ${isSelected ? "bg-fn-green/5" : "hover:bg-fn-card/50"}`}
                        onClick={() => setSelected(team)}
                      >
                        <td className="py-3 pr-4">
                          <span className="font-display text-lg font-black" style={{ color: c }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                            <span className="text-[11px] font-bold text-fn-text">{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[10px] text-fn-green font-bold">{team.wins}</td>
                        <td className="py-3 pr-4 text-[10px] text-fn-red">{team.losses}</td>
                        <td className="py-3 pr-4 text-[10px] text-fn-text">{wr2}%</td>
                        <td className="py-3 pr-4 text-[10px] text-fn-text">{team.kills.toLocaleString()}</td>
                        <td className="py-3 text-[10px] text-fn-muted">{team.region || "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
