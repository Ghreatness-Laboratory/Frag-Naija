"use client";
import { useState } from "react";
import { teams, leaderboard } from "@/lib/data";
import { ChevronRight } from "lucide-react";

export default function TeamsPage() {
  const [selected, setSelected] = useState(teams[0]);

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
          <div className="flex gap-4">
            <div className="text-right">
              <div className="fn-label mb-0.5">PHASE IN</div>
              <div className="font-display text-lg font-black text-fn-yellow">RAINFALL</div>
            </div>
            <div className="text-right">
              <div className="fn-label mb-0.5">PRIZE POOL</div>
              <div className="font-display text-lg font-black text-fn-green">₦25,000,000</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Team selector grid */}
        <div className="mb-8">
          <div className="fn-label mb-4">— SELECT COMMAND</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {teams.map((t) => {
              const isActive = t.id === selected.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`p-3 rounded-sm border transition-all text-left ${
                    isActive
                      ? "border-fn-green bg-fn-green/10 glow-green"
                      : "border-fn-gborder bg-fn-card hover:border-fn-green/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xl font-display font-black mb-2"
                    style={{ background: `${t.color}18`, border: `1px solid ${t.color}30`, color: t.color }}>
                    {t.tag[0]}
                  </div>
                  <div className="text-[10px] font-bold text-fn-text truncate">{t.name}</div>
                  <div className="fn-label">{t.tag}</div>
                  <div className="mt-1 text-[9px]" style={{ color: t.color }}>#{t.rank}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected team detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team card */}
          <div className="lg:col-span-1">
            <div className="bg-fn-card border rounded-sm p-5" style={{ borderColor: `${selected.color}40` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-sm flex items-center justify-center text-2xl font-display font-black"
                  style={{ background: `${selected.color}18`, border: `2px solid ${selected.color}50`, color: selected.color }}>
                  {selected.tag[0]}
                </div>
                <div className="text-right">
                  <span className="font-display text-4xl font-black" style={{ color: selected.color }}>#{selected.rank}</span>
                </div>
              </div>
              <h2 className="font-display text-2xl font-black uppercase text-fn-text mb-1">{selected.name}</h2>
              <p className="fn-label mb-4">{selected.region}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { v: selected.wins,    l: "Wins"     },
                  { v: selected.losses,  l: "Losses"   },
                  { v: selected.winRate + "%", l: "Win Rate" },
                  { v: selected.prize,   l: "Earnings" },
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
                <div className="stat-bar-fill" style={{ width: `${selected.winRate}%`, background: selected.color }} />
              </div>
            </div>
          </div>

          {/* Active roster */}
          <div className="lg:col-span-2">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-5">
              <div className="fn-label mb-4">ACTIVE ROSTER RUN</div>
              <div className="space-y-2">
                {selected.players.map((player, i) => (
                  <div key={player} className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm hover:border-fn-green/30 transition-colors">
                    <span className="text-[9px] font-bold text-fn-muted w-4 flex-shrink-0">0{i + 1}</span>
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-display font-black flex-shrink-0"
                      style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30`, color: selected.color }}>
                      {player[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-fn-text">{player}</div>
                      <div className="fn-label">Active Operator</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-bold text-fn-text">{(Math.random() * 2 + 2.5).toFixed(1)}</div>
                        <div className="fn-label">K/D</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-bold text-fn-text">{Math.floor(Math.random() * 40 + 60)}%</div>
                        <div className="fn-label">WR</div>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-fn-green" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Operational leaderboard */}
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
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-fn-gborder">
                  {["RANK", "SQUAD/CALLSIGN", "WINS", "KILLS", "WIN %", "PRIZE", "STATUS"].map((h) => (
                    <th key={h} className="fn-label pb-3 text-left pr-4 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => {
                  const team = teams.find((t) => t.name.toLowerCase().includes(row.team.split(" ")[0].toLowerCase()));
                  const col = team?.color ?? "#3d5c3d";
                  const isSelected = selected.name.includes(row.team.split(" ")[0]);
                  return (
                    <tr
                      key={row.rank}
                      className={`border-b border-fn-gborder/40 transition-colors ${isSelected ? "bg-fn-green/5" : "hover:bg-fn-card/50"}`}
                    >
                      <td className="py-3 pr-4">
                        <span className="font-display text-lg font-black" style={{ color: col }}>
                          {row.rank <= 3 ? ["01", "02", "03"][row.rank - 1] : `0${row.rank}`}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: col }} />
                          <span className="text-[11px] font-bold text-fn-text">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[10px] text-fn-green font-bold">{row.wins}%</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-text">{row.kills}</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-text">{row.rating}%</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-yellow font-bold">{row.prize}</td>
                      <td className="py-3">
                        <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 ${
                          row.status === "active"
                            ? "bg-fn-green/20 text-fn-green border border-fn-gborder"
                            : "bg-fn-red/20 text-fn-red border border-fn-red/30"
                        }`}>
                          {row.status.toUpperCase()}
                        </span>
                      </td>
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
