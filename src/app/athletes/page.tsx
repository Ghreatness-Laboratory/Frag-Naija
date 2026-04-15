"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, Target, Crosshair, Zap } from "lucide-react";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  team: string | null;
  role: string | null;
  rating: number;
  kills: number;
  assists: number;
  damage: number;
  winrate: number;
  photo_url: string | null;
  status: string;
  bio: string | null;
};

function StatBar({ label, value, color = "#00ff41" }: { label: string; value: number; color?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="fn-label">{label}</span>
        <span className="text-[10px] font-bold text-fn-text">{value}</span>
      </div>
      <div className="stat-bar">
        <div
          className="stat-bar-fill"
          style={{ width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

const abilityIcons = [Shield, Target, Crosshair];

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/athletes");
    if (res.ok) {
      const data: Athlete[] = await res.json();
      setAthletes(data);
      if (data.length > 0) setSelected(data[0]);
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

  if (athletes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fn-black gap-4">
        <Shield className="w-12 h-12 text-fn-muted" />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No athletes yet</p>
        <p className="text-fn-muted text-xs">Add athletes in the admin panel to see them here.</p>
      </div>
    );
  }

  const a = selected!;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar list */}
      <aside className="lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        <div className="p-4 border-b border-fn-gborder flex items-center justify-between">
          <div>
            <div className="fn-label mb-0.5">SECTOR ROSTER</div>
            <h1 className="font-display text-xl font-black uppercase text-fn-text">ATHLETES</h1>
          </div>
          <span className="text-[9px] font-bold text-fn-green border border-fn-gborder px-2 py-1">{athletes.length} TOTAL</span>
        </div>

        <div className="overflow-y-auto max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-14rem)]">
          {athletes.map((athlete) => {
            const isActive = athlete.id === a.id;
            return (
              <button
                key={athlete.id}
                onClick={() => setSelected(athlete)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-fn-gborder/50 transition-all text-left ${
                  isActive ? "bg-fn-green/10 border-l-2 border-l-fn-green" : "hover:bg-fn-card/50 border-l-2 border-l-transparent"
                }`}
              >
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-sm font-display font-black flex-shrink-0 overflow-hidden ${
                  isActive ? "bg-fn-green/20 text-fn-green border border-fn-green/40" : "bg-fn-card text-fn-muted border border-fn-gborder"
                }`}>
                  {athlete.photo_url
                    ? <img src={athlete.photo_url} alt={athlete.ign} className="w-full h-full object-cover" />
                    : athlete.ign[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate text-fn-text">{athlete.ign}</div>
                  <div className="fn-label truncate">{athlete.role || "Player"}</div>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-fn-green flex-shrink-0" />}
              </button>
            );
          })}
        </div>

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
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-fn-green/15 border-2 border-fn-green flex items-center justify-center glow-green overflow-hidden">
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.ign} className="w-full h-full object-cover" />
                    : <span className="font-display text-4xl font-black text-fn-green">{a.ign[0]}</span>}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-fn-green flex items-center justify-center">
                  <Zap size={11} className="text-fn-black" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase border border-fn-gborder ${
                    a.status === "Active" ? "bg-fn-green/20 text-fn-green" : "bg-fn-muted/20 text-fn-muted"
                  }`}>
                    ● {a.status}
                  </span>
                  {a.team && (
                    <span className="text-[9px] text-fn-muted font-bold tracking-widest">{a.team}</span>
                  )}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-fn-text tracking-wide">{a.ign}</h2>
                <p className="text-fn-muted text-[10px] tracking-wider">{a.name}{a.role ? ` · ${a.role}` : ""}</p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-4 sm:gap-6">
                {[
                  { v: a.kills,   l: "KILLS"   },
                  { v: a.assists, l: "ASSISTS"  },
                  { v: `${a.winrate}%`, l: "WIN RATE" },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <div className="font-display text-2xl sm:text-3xl font-black text-fn-text">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid: metrics + bio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance metrics */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4">PERFORMANCE METRICS</div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                {[
                  { v: `${a.winrate}%`, l: "Win Rate" },
                  { v: a.rating.toFixed(1), l: "Rating" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-3">
                    <div className="font-display text-xl font-black text-fn-green">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
              <StatBar label="KILL RATE"   value={Math.min(a.kills,   100)} color="#00ff41" />
              <StatBar label="WIN RATE"    value={Math.min(a.winrate, 100)} color="#f0c040" />
              <StatBar label="ASSISTS"     value={Math.min(a.assists, 100)} color="#00aaff" />
              <StatBar label="DAMAGE AVG"  value={Math.min(Math.round(a.damage / 10), 100)} color="#ff6b8a" />
            </div>

            {/* Role & stats panel */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4">OPERATOR PROFILE</div>
              <div className="space-y-3">
                {[
                  { icon: Shield,   label: "Role",     value: a.role || "—"    },
                  { icon: Target,   label: "Team",     value: a.team || "Free Agent" },
                  { icon: Crosshair,label: "Status",   value: a.status         },
                  { icon: Zap,      label: "Damage",   value: a.damage.toLocaleString() },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm">
                    <div className="w-8 h-8 bg-fn-green/15 border border-fn-gborder flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-fn-green" />
                    </div>
                    <div>
                      <div className="fn-label">{label}</div>
                      <div className="text-[11px] font-bold text-fn-text">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-fn-dark border border-fn-gborder rounded-sm flex items-center justify-between">
                <span className="fn-label">OVERALL WIN RATE</span>
                <span className="text-fn-green font-display text-2xl font-black">{a.winrate}%</span>
              </div>
            </div>

            {/* Bio */}
            {a.bio && (
              <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5 lg:col-span-2">
                <div className="fn-label mb-3">DOSSIER</div>
                <p className="text-fn-muted text-[11px] leading-relaxed">{a.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
