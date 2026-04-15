"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, Target, Crosshair, Zap, Star, TrendingUp, TrendingDown } from "lucide-react";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  team: string | null;
  role: string | null;
  overall_rating: number;
  attack: number;
  defense: number;
  clutch: number;
  survival: number;
  iq: number;
  aggression: number;
  kills: number;
  assists: number;
  damage: number;
  winrate: number;
  photo_url: string | null;
  status: string;
  bio: string | null;
  perks: string[] | string | null;
  strengths: string[] | string | null;
  weaknesses: string[] | string | null;
};

function computeRating(a: Athlete): number {
  if (a.overall_rating) return Number(a.overall_rating);
  const vals = [a.attack, a.defense, a.clutch, a.survival, a.iq, a.aggression]
    .map(Number).filter((v) => v > 0);
  if (!vals.length) return Number(a.overall_rating ?? 0);
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

function parseArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { const p = JSON.parse(String(val)); return Array.isArray(p) ? p.filter(Boolean) : []; }
  catch { return String(val).split(",").map((s) => s.trim()).filter(Boolean); }
}

function StatBar({ label, value, color = "#00ff41" }: { label: string; value: number; color?: string }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="fn-label">{label}</span>
        <span className="text-[10px] font-bold text-fn-text font-mono">{pct}</span>
      </div>
      <div className="h-1.5 bg-fn-dark border border-fn-gborder rounded-sm overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

function RatingRing({ value }: { value: number }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 10);
  const color = pct >= 8 ? "#00ff41" : pct >= 6 ? "#f0c040" : "#ff4141";
  return (
    <div
      className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
      style={{ borderColor: color, boxShadow: `0 0 18px ${color}40` }}
    >
      <div className="text-center">
        <div className="font-display text-2xl font-black" style={{ color }}>{pct.toFixed(1)}</div>
        <div className="fn-label text-[7px] mt-0.5">OVR</div>
      </div>
    </div>
  );
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/athletes", { cache: "no-store" });
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
      </div>
    );
  }

  const a = selected!;
  const rating = computeRating(a);
  const perks = parseArray(a.perks);
  const strengths = parseArray(a.strengths);
  const weaknesses = parseArray(a.weaknesses);

  const attrs = [
    { label: "ATTACK",     value: a.attack ?? 0,     color: "#ff6b8a" },
    { label: "DEFENSE",    value: a.defense ?? 0,    color: "#00aaff" },
    { label: "CLUTCH",     value: a.clutch ?? 0,     color: "#f0c040" },
    { label: "SURVIVAL",   value: a.survival ?? 0,   color: "#00ff41" },
    { label: "IQ",         value: a.iq ?? 0,         color: "#b06eff" },
    { label: "AGGRESSION", value: a.aggression ?? 0, color: "#ff8c42" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar roster */}
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
            const isActive = selected?.id === athlete.id;
            const r = computeRating(athlete);
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
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate text-fn-text">{athlete.ign}</div>
                  <div className="fn-label truncate">{athlete.role || "Player"}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[11px] font-bold font-mono text-fn-green">{r.toFixed(1)}</div>
                  <div className="fn-label text-[7px]">OVR</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-fn-gborder bg-fn-card/30">
          <div className="fn-label text-fn-green mb-1">RECRUITMENT OPEN</div>
          <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
            JOIN FRAG NAIJA AND GET RANKED IN THE SECTOR TRIALS.
          </p>
          <a href="/contact" className="fn-btn w-full text-[10px] block text-center py-2">JOIN THE RANKS</a>
        </div>
      </aside>

      {/* Main profile */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          {/* Profile header */}
          <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
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
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase border border-fn-gborder ${
                    a.status === "Active" ? "bg-fn-green/20 text-fn-green" : "bg-fn-muted/20 text-fn-muted"
                  }`}>● {a.status}</span>
                  {a.team && <span className="text-[9px] text-fn-muted font-bold tracking-widest">{a.team}</span>}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-fn-text tracking-wide">{a.ign}</h2>
                <p className="text-fn-muted text-[10px] tracking-wider">{a.name}{a.role ? ` · ${a.role}` : ""}</p>
              </div>
              <div className="flex-shrink-0"><RatingRing value={rating} /></div>
            </div>
          </div>

          {/* Combat Attributes + Operator Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4 flex items-center gap-2">
                <Star size={10} className="text-fn-green" /> COMBAT ATTRIBUTES
              </div>
              {attrs.map(({ label, value, color }) => (
                <StatBar key={label} label={label} value={Number(value)} color={color} />
              ))}
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4 flex items-center gap-2">
                <Target size={10} className="text-fn-green" /> OPERATOR PROFILE
              </div>
              <div className="space-y-2">
                {[
                  { icon: Shield,    label: "Role",   value: a.role || "—"           },
                  { icon: Crosshair, label: "Team",   value: a.team || "Free Agent"  },
                  { icon: Zap,       label: "Status", value: a.status                 },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm">
                    <div className="w-8 h-8 bg-fn-green/15 border border-fn-gborder flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-fn-green" />
                    </div>
                    <div>
                      <div className="fn-label">{label}</div>
                      <div className="text-[11px] font-bold text-fn-text">{value}</div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-fn-dark border border-fn-gborder rounded-sm">
                  <div className="flex justify-between mb-2">
                    <span className="fn-label">OVERALL RATING</span>
                    <span className="text-fn-green font-display text-xl font-black">{rating.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-fn-black rounded-sm overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-fn-green/60 to-fn-green rounded-sm" style={{ width: `${(rating / 10) * 100}%` }} />
                  </div>
                  <div className="fn-label mt-1 text-right">{rating.toFixed(1)} / 10.0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Perks / Strengths / Weaknesses */}
          {(perks.length > 0 || strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {perks.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5"><Zap size={9} className="text-fn-yellow" /> PERKS</div>
                  <div className="space-y-1.5">
                    {perks.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-[10px] text-fn-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-fn-yellow flex-shrink-0" />{p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {strengths.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5"><TrendingUp size={9} className="text-fn-green" /> STRENGTHS</div>
                  <div className="space-y-1.5">
                    {strengths.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-[10px] text-fn-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-fn-green flex-shrink-0" />{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5"><TrendingDown size={9} className="text-fn-red" /> WEAKNESSES</div>
                  <div className="space-y-1.5">
                    {weaknesses.map((w) => (
                      <div key={w} className="flex items-center gap-2 text-[10px] text-fn-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-fn-red flex-shrink-0" />{w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {a.bio && (
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-3">DOSSIER</div>
              <p className="text-fn-muted text-[11px] leading-relaxed">{a.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
