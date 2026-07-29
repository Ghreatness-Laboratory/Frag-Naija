"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, Target, Crosshair, Zap, Star, TrendingUp, TrendingDown, Flame, Search, ChevronRight } from "lucide-react";
import PlayerCardTemplate from "@/components/athletes/PlayerCardTemplate";
import { useGame } from "@/context/GameContext";
import { getGameContent } from "@/lib/game-content";
import { GAMES } from "@/lib/games";
import { athleteStatusTone, combatAttributes } from "@/lib/athlete-display";
import { calculateAthleteOverallRating } from "@/lib/athlete-rating";

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
  jersey_number?: number | string | null;
  known_name?: string | null;
  previous_aliases?: string[] | string | null;
  previous_teams?: { team: string; years: string }[] | string | null;
  achievements?: { title: string; date: string }[] | string | null;
  performance_history?: { label: string; value: string; date: string }[] | string | null;
  perks: string[] | string | null;
  strengths: string[] | string | null;
  weaknesses: string[] | string | null;
  game_slug?: string | null;
  is_icon?: boolean | null;
};

function computeRating(a: Athlete): number {
  return calculateAthleteOverallRating(a as unknown as Record<string, unknown>, a.game_slug) ?? 0;
}

function parseArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  try { const p = JSON.parse(String(val)); return Array.isArray(p) ? p.filter(Boolean) : []; }
  catch { return String(val).split(",").map((s) => s.trim()).filter(Boolean); }
}

function parseObjectArray<T extends Record<string, string>>(val: T[] | string | null | undefined): T[] {
  if (!val) return [];
  const raw = Array.isArray(val) ? val : (() => {
    try { return JSON.parse(String(val)); } catch { return []; }
  })();

  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, String(value ?? "")])) as T)
    .filter((item) => Object.values(item).some(Boolean));
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="fn-label text-fn-green">{label}</span>
        <span className="text-[10px] font-bold text-white font-mono">{pct}</span>
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

export default function AthletesPage() {
  const { selectedGame, setSelectedGame, isHydrated } = useGame();
  const [apiAthletes, setApiAthletes] = useState<Athlete[]>([]);
  const [selected, setSelected] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const primary   = selectedGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const secondary = selectedGame?.colors.secondary ?? 'rgb(var(--fn-yellow))';
  const isFF      = selectedGame?.slug === 'free-fire';

  const load = useCallback(async () => {
    if (!selectedGame) {
      setApiAthletes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/athletes?game_slug=${selectedGame.slug}`, { cache: "no-store" });
    if (res.ok) {
      const data: Athlete[] = await res.json();
      setApiAthletes(data);
    }
    setLoading(false);
  }, [selectedGame]);

  useEffect(() => {
    const requestedGame = new URLSearchParams(window.location.search).get("game");
    const game = GAMES.find((item) => item.slug === requestedGame && item.available);
    if (game && game.slug !== selectedGame?.slug) setSelectedGame(game);
  }, [selectedGame?.slug, setSelectedGame]);

  useEffect(() => { load(); }, [load]);

  const gameContent = isHydrated && selectedGame ? getGameContent(selectedGame.slug) : null;
  const apiForGame = selectedGame ? apiAthletes.filter((a) => (a.game_slug ?? selectedGame.slug) === selectedGame.slug) : [];
  const gameAthletes: Athlete[] = apiForGame.length > 0
    ? apiForGame
    : (gameContent?.athletes as Athlete[] | undefined) ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const iconAthletes = gameAthletes.filter((a) => Boolean(a.is_icon));
  const searchableAthletes = gameAthletes.filter((a) => !a.is_icon);
  const athletes = normalizedSearch
    ? searchableAthletes.filter((a) => `${a.name} ${a.ign} ${a.known_name ?? ""}`.toLowerCase().includes(normalizedSearch))
    : searchableAthletes;

  // Auto-select first athlete when list loads
  useEffect(() => {
    const selectable = athletes.length > 0 ? athletes : iconAthletes;
    if (selectable.length > 0 && !selected) setSelected(selectable[0]);
    if (selectable.length > 0 && selected && !selectable.find(a => a.id === selected.id) && !iconAthletes.find(a => a.id === selected.id)) {
      setSelected(selectable[0]);
    }
  }, [athletes.length, iconAthletes.length, selectedGame?.slug, normalizedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedGame) {
    return (
      <div className="min-h-screen px-4 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl rounded-sm border border-fn-gborder bg-fn-card p-8 text-center">
          <Shield className="mx-auto mb-4 h-10 w-10 text-fn-green" />
          <h1 className="font-display text-3xl font-black uppercase text-fn-text">Select a game to scout athletes</h1>
          <p className="mt-3 text-xs leading-relaxed text-fn-muted">
            Athlete rosters are game-scoped. Choose a game first to view player rankings and profiles.
          </p>
          <Link href="/select-game" className="fn-btn mt-6 inline-flex items-center gap-2">
            Select Game <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primary} transparent transparent transparent` }} />
      </div>
    );
  }

  if (gameAthletes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12" style={{ color: primary }} />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No {selectedGame.shortName} athletes yet</p>
      </div>
    );
  }

  const a = selected ?? athletes[0] ?? iconAthletes[0];
  const rating = computeRating(a);
  const perks = parseArray(a.perks);
  const strengths = parseArray(a.strengths);
  const weaknesses = parseArray(a.weaknesses);
  const previousAliases = parseArray(a.previous_aliases);
  const previousTeams = parseObjectArray<{ team: string; years: string }>(a.previous_teams);
  const achievements = parseObjectArray<{ title: string; date: string }>(a.achievements);
  const performanceHistory = parseObjectArray<{ label: string; value: string; date: string }>(a.performance_history);
  const displayName = a.known_name || a.ign;

  const attrs = combatAttributes(a as unknown as Record<string, unknown>, a.game_slug);
  const statusTone = athleteStatusTone(a.status, primary);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar roster */}
      <aside className="lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        <div
          className="p-4 border-b border-fn-gborder"
          style={{ background: `linear-gradient(135deg, ${primary}06 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            {isFF && <Flame size={10} style={{ color: primary }} />}
            <div className="fn-label">ROSTER</div>
          </div>
          <h1 className="font-display text-xl font-black uppercase text-fn-text">ATHLETES</h1>
          <div className="mt-2">
            <span
              className="text-[9px] font-bold px-2 py-1 tracking-widest uppercase border"
              style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
            >
              {athletes.length} {selectedGame.shortName.toUpperCase()} PLAYERS
            </span>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-sm border border-fn-gborder bg-fn-black/70 px-3 py-2 focus-within:border-fn-green/60">
            <Search size={13} style={{ color: primary }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search athletes / IGN"
              className="w-full bg-transparent text-xs text-fn-text outline-none placeholder:text-fn-muted"
            />
          </label>
        </div>

        <div className="overflow-y-auto max-h-[40vh] lg:max-h-none lg:h-[calc(100vh-18rem)]">
          {athletes.length === 0 ? (
            <p className="px-4 py-6 text-[10px] uppercase tracking-widest text-fn-muted">No results found for &quot;{search}&quot;</p>
          ) : athletes.map((athlete, index) => {
            const isActive = (selected?.id ?? athletes[0].id) === athlete.id;
            const r = computeRating(athlete);
            return (
              <div key={athlete.id} className="border-b border-fn-gborder/50">
              <button
                onClick={() => setSelected((current) => current?.id === athlete.id ? null : athlete)}
                aria-expanded={isActive}
                className="w-full p-2 transition-all text-left"
                style={isActive
                  ? { background: `${primary}10`, borderLeft: `2px solid ${primary}` }
                  : { borderLeft: '2px solid transparent' }}
              >
                <PlayerCardTemplate
                  athlete={athlete}
                  rating={r}
                  primary={primary}
                  gameName={selectedGame.shortName.toUpperCase()}
                  rank={index + 1}
                  variant="compact"
                  className={isActive ? '' : 'opacity-80'}
                />
              </button>
              {isActive && athlete.bio && (
                <div className="border-b border-fn-gborder/50 bg-fn-black/45 px-4 pb-3 pt-1">
                  <div className="rounded-sm border border-fn-gborder bg-fn-card/80 p-2.5">
                    <p className="fn-mini-bio text-[10px] leading-relaxed text-fn-muted">{athlete.bio}</p>
                    <Link href={`/athletes/${athlete.id}`} className="mt-2 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-fn-green">
                      View full profile <ChevronRight size={10} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-fn-gborder" style={{ background: `${primary}05` }}>
          <div className="fn-label mb-1" style={{ color: primary }}>RECRUITMENT OPEN</div>
          <p className="text-[9px] text-fn-muted leading-relaxed mb-3">
            JOIN FRAG NAIJA AND GET RANKED IN THE OPEN TRIALS.
          </p>
          <button
            className="w-full text-[10px] py-2 font-bold tracking-widest uppercase border rounded-sm transition-all"
            style={{ borderColor: `${primary}40`, color: primary, background: `${primary}10` }}
          >
            JOIN THE RANKS
          </button>
        </div>
      </aside>

      {/* Main profile */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          {iconAthletes.length > 0 && (
            <section className="mb-5 rounded-sm border border-fn-yellow/30 bg-fn-yellow/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="fn-label text-fn-yellow">ICON TIER</p>
                  <h2 className="font-display text-xl font-black uppercase text-fn-text">ICONS</h2>
                </div>
                <span className="rounded-sm border border-fn-yellow/40 bg-fn-yellow/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fn-yellow">
                  {iconAthletes.length} Legend{iconAthletes.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {iconAthletes.map((athlete) => (
                  <button key={athlete.id} type="button" onClick={() => setSelected(athlete)} className="w-56 flex-shrink-0 text-left">
                    <PlayerCardTemplate
                      athlete={athlete}
                      rating={computeRating(athlete)}
                      primary={primary}
                      gameName={selectedGame.shortName.toUpperCase()}
                      variant="icon"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Profile header */}
          <div
            className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 mb-4"
            style={{ background: `linear-gradient(135deg, ${primary}06 0%, rgb(var(--fn-black)) 60%)` }}
          >
            <div className="grid gap-5 lg:grid-cols-[230px_1fr] lg:items-center">
              <PlayerCardTemplate
                athlete={a}
                rating={rating}
                primary={primary}
                gameName={selectedGame.shortName.toUpperCase()}
                variant="featured"
                className="mx-0"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase border"
                    style={{ background: statusTone.background, color: statusTone.color, borderColor: statusTone.borderColor }}
                  >
                    <span style={{ color: statusTone.dotColor }}>●</span> {a.status}
                  </span>
                  {a.team && <span className="text-[9px] text-fn-muted font-bold tracking-widest">{a.team}</span>}
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-fn-text tracking-wide">{displayName}</h2>
                <p className="text-fn-muted text-[10px] tracking-wider">{a.name}{a.role ? ` · ${a.role}` : ""}</p>
                {previousAliases.length > 0 && (
                  <p className="mt-1 text-[9px] uppercase tracking-widest text-fn-muted">
                    Also known as: <span className="text-fn-text">{previousAliases.join(" · ")}</span>
                  </p>
                )}
                <div className="mt-5 max-w-sm border border-fn-gborder bg-fn-dark/70 p-3">
                  <div className="flex justify-between mb-2">
                    <span className="fn-label">OVERALL RATING</span>
                    <span className="font-display text-xl font-black" style={{ color: primary }}>{rating}</span>
                  </div>
                  <div className="h-2 bg-fn-black rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${rating}%`, background: `linear-gradient(90deg, ${primary}60, ${primary})` }}
                    />
                  </div>
                  <div className="fn-label mt-1 text-right">{rating} / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Combat Attributes + Operator Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4 flex items-center gap-2">
                <Star size={10} style={{ color: primary }} /> COMBAT ATTRIBUTES
              </div>
              {attrs.map(({ label, value, color }) => (
                <StatBar key={label} label={label} value={Number(value)} color={color} />
              ))}
            </div>
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5">
              <div className="fn-label mb-4 flex items-center gap-2">
                <Target size={10} style={{ color: primary }} /> OPERATOR PROFILE
              </div>
              <div className="space-y-2">
                {[
                  { icon: Shield,    label: "Role",   value: a.role || "—"           },
                  { icon: Crosshair, label: "Team",   value: a.team || "Free Agent"  },
                  { icon: Zap,       label: "Status", value: a.status                 },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-fn-dark border border-fn-gborder rounded-sm">
                    <div
                      className="w-8 h-8 border flex items-center justify-center flex-shrink-0"
                      style={{ background: `${primary}15`, borderColor: `${primary}30` }}
                    >
                      <Icon size={14} style={{ color: primary }} />
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
                    <span className="font-display text-xl font-black" style={{ color: primary }}>{rating}</span>
                  </div>
                  <div className="h-2 bg-fn-black rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${rating}%`, background: `linear-gradient(90deg, ${primary}60, ${primary})` }}
                    />
                  </div>
                  <div className="fn-label mt-1 text-right">{rating} / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Stats */}
          {(a.kills || a.assists || a.damage || a.winrate) ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "K/G", value: a.kills?.toFixed(1) ?? "—" },
                { label: "A/G", value: a.assists?.toFixed(1) ?? "—" },
                { label: "DMG", value: a.damage?.toLocaleString() ?? "—" },
                { label: "WIN%", value: a.winrate ? `${a.winrate}%` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-fn-card border border-fn-gborder rounded-sm p-3 text-center">
                  <div className="font-display text-xl font-black" style={{ color: secondary }}>{value}</div>
                  <div className="fn-label">{label}</div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Perks / Strengths / Weaknesses */}
          {(perks.length > 0 || strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {perks.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5">
                    <Zap size={9} style={{ color: isFF ? '#FFD700' : 'rgb(var(--fn-yellow))' }} /> PERKS
                  </div>
                  <div className="space-y-1.5">
                    {perks.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-[10px] text-fn-text">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isFF ? '#FFD700' : 'rgb(var(--fn-yellow))' }} />{p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {strengths.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5">
                    <TrendingUp size={9} style={{ color: primary }} /> STRENGTHS
                  </div>
                  <div className="space-y-1.5">
                    {strengths.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-[10px] text-fn-text">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: primary }} />{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                  <div className="fn-label mb-3 flex items-center gap-1.5">
                    <TrendingDown size={9} className="text-fn-red" /> WEAKNESSES
                  </div>
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

          {/* Career history */}
          {(previousTeams.length > 0 || achievements.length > 0 || performanceHistory.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                <div className="fn-label mb-3" style={{ color: primary }}>CAREER</div>
                <div className="space-y-2">
                  <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                    <div className="fn-label mb-1">CURRENT TEAM</div>
                    <div className="text-[11px] font-bold text-fn-text">{a.team || "Free Agent"}</div>
                  </div>
                  {previousTeams.length > 0 ? previousTeams.map((team, index) => (
                    <div key={`${team.team}-${index}`} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                      <div className="fn-label mb-1">PREVIOUS TEAM</div>
                      <div className="text-[11px] font-bold text-fn-text">{team.team}</div>
                      {team.years && <div className="fn-label mt-0.5">{team.years}</div>}
                    </div>
                  )) : (
                    <div className="text-[10px] text-fn-muted">No previous teams recorded.</div>
                  )}
                </div>
              </div>

              <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                <div className="fn-label mb-3" style={{ color: primary }}>ACHIEVEMENTS</div>
                {achievements.length > 0 ? (
                  <div className="space-y-2">
                    {achievements.map((item, index) => (
                      <div key={`${item.title}-${index}`} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                        <div className="text-[11px] font-bold text-fn-text">{item.title}</div>
                        {item.date && <div className="fn-label mt-0.5">{item.date}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-fn-muted">No titles recorded yet.</div>
                )}
              </div>

              <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
                <div className="fn-label mb-3" style={{ color: primary }}>PERFORMANCE HISTORY</div>
                {performanceHistory.length > 0 ? (
                  <div className="space-y-2">
                    {performanceHistory.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                        <div className="text-[11px] font-bold text-fn-text">{item.label}</div>
                        {item.value && <div className="mt-1 text-[10px] text-fn-green">{item.value}</div>}
                        {item.date && <div className="fn-label mt-0.5">{item.date}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-fn-muted">No performance history recorded.</div>
                )}
              </div>
            </div>
          )}

          {/* Bio */}
          {a.bio && (
            <div
              className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-5"
              style={{ borderColor: `${primary}20` }}
            >
              <div className="fn-label mb-3" style={{ color: primary }}>DOSSIER</div>
              <p className="text-fn-muted text-[11px] leading-relaxed">{a.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
