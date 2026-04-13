"use client";
import { useState } from "react";
import { athletes } from "@/lib/data";
import { Shield, Target, Crosshair, Zap, Clock } from "lucide-react";

function StatBar({ label, value, color = "#00ff41" }: { label: string; value: number; color?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="fn-label">{label}</span>
        <span className="text-[10px] font-bold text-white">{value}%</span>
      </div>
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

const abilityIcons = [Shield, Target, Crosshair];

export default function AthletesPage() {
  const [selected, setSelected] = useState(athletes[0]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar list */}
      <aside className="lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-fn-gborder flex items-center justify-between">
          <div>
            <div className="fn-label mb-0.5">SECTOR ROSTER</div>
            <h1 className="font-display text-xl font-black uppercase text-white">ATHLETES</h1>
          </div>
          <span className="text-[9px] font-bold text-fn-green border border-fn-gborder px-2 py-1">{athletes.length} TOTAL</span>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-14rem)]">
          {athletes.map((a) => {
            const isActive = a.id === selected.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-fn-gborder/50 transition-all text-left ${
                  isActive ? "bg-fn-green/10 border-l-2 border-l-fn-green" : "hover:bg-fn-card/50 border-l-2 border-l-transparent"
                }`}
              >
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-sm font-display font-black flex-shrink-0 ${
                  isActive ? "bg-fn-green/20 text-fn-green border border-fn-green/40" : "bg-fn-card text-fn-muted border border-fn-gborder"
                }`}>
                  {a.tag[0]}
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] font-bold truncate ${isActive ? "text-white" : "text-fn-text"}`}>{a.tag}</div>
                  <div className="fn-label truncate">{a.rank}</div>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fn-green flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Recruitment banner */}
        <div className="p-4 border-t border-fn-gborder bg-fn-card/30">
          <div className="fn-label text-fn-green mb-1">RECRUITMENT OPEN</div>
          <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
            FRAG QUALIFIED ATHLETES IN THE SECTOR TRIALS.
          </p>
          <button className="fn-btn w-full text-[10px]">JOIN THE RANKS</button>
        </div>
      </aside>

      {/* Main profile */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          {/* Profile header */}
          <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-fn-green/15 border-2 border-fn-green flex items-center justify-center glow-green flex-shrink-0">
                  <span className="font-display text-4xl font-black text-fn-green">{selected.tag[0]}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-fn-green flex items-center justify-center">
                  <Zap size={11} className="text-fn-black" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold bg-fn-green/20 text-fn-green border border-fn-gborder px-2 py-0.5 tracking-widest uppercase">
                    ● ELITE RANGER
                  </span>
                  <span className="text-[9px] text-fn-muted font-bold tracking-widest">#{selected.rankNum}</span>
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-wide">{selected.tag}</h2>
                <p className="text-fn-muted text-[10px] tracking-wider">{selected.rank} · {selected.team}</p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 sm:gap-6">
                {[
                  { v: selected.kills, l: "K/D AVG" },
                  { v: selected.headshots, l: "HEADSHOTS" },
                  { v: selected.matches, l: "MATCHES" },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <div className="font-display text-2xl sm:text-3xl font-black text-white">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid: metrics + abilities + history */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance metrics */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4">PERFORMANCE METRICS</div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                {[
                  { v: selected.winRate + "%", l: "Win Rate" },
                  { v: selected.stats.weaponAccuracy + "%", l: "Accuracy" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-3">
                    <div className="font-display text-xl font-black text-fn-green">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
              <StatBar label="WEAPON ACCURACY"  value={selected.stats.weaponAccuracy} color="#00ff41" />
              <StatBar label="OFFENSE RATING"   value={selected.stats.offenseRating}  color="#f0c040" />
              <StatBar label="MOVEMENT INDEX"   value={selected.stats.movementIndex}  color="#00aaff" />
              <StatBar label="TEAM RATING"       value={selected.stats.teamRating}     color="#ff6b8a" />
            </div>

            {/* Active abilities */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4">ACTIVE ABILITIES</div>
              <div className="space-y-3">
                {selected.abilities.map((ab, i) => {
                  const Icon = abilityIcons[i % abilityIcons.length];
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm hover:border-fn-green/40 transition-colors">
                      <div className="w-8 h-8 bg-fn-green/15 border border-fn-gborder flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-fn-green" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white mb-0.5">{ab.name}</div>
                        <div className="text-[9px] text-fn-muted leading-relaxed">{ab.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Win rate indicator */}
              <div className="mt-4 p-3 bg-fn-dark border border-fn-gborder rounded-sm flex items-center justify-between">
                <span className="fn-label">OVERALL WIN RATE</span>
                <span className="text-fn-green font-display text-2xl font-black">{selected.winRate}%</span>
              </div>
            </div>

            {/* Service history */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5 lg:col-span-2">
              <div className="fn-label mb-4">SERVICE HISTORY</div>
              <div className="space-y-2">
                {selected.history.map((h, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 border rounded-sm ${h.active ? "border-fn-green/30 bg-fn-green/5" : "border-fn-gborder"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${h.active ? "bg-fn-green animate-pulse-g" : "bg-fn-muted"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-white tracking-wide">{h.team}</div>
                      <div className="fn-label">{h.role}</div>
                    </div>
                    {h.active && (
                      <span className="text-[8px] font-bold text-fn-green border border-fn-gborder px-2 py-0.5 tracking-widest flex-shrink-0">
                        ACTIVE
                      </span>
                    )}
                    <Clock size={11} className="text-fn-muted flex-shrink-0" />
                  </div>
                ))}
              </div>
              <button className="mt-4 fn-btn-ghost text-[9px] flex items-center gap-1">
                VIEW FULL DOSSIER →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
