'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarClock, Lock, Unlock, CheckCircle2,
  Award, Search, X, Shield, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { isFootballGame } from '@/lib/game-categories';

const shooterScoringRows = [
  ['Participation (played)', '+1'],
  ['Kill', '+2'],
  ['Top 3 finish', '+5'],
  ['Match win', '+10'],
  ['MVP', '+5'],
  ['Captain multiplier', '2×'],
];

const footballScoringRows = [
  ['Appearance / Played', '+1'],
  ['Goal scored', '+5'],
  ['Assist', '+3'],
  ['Match win', '+3'],
  ['Match loss', '-1'],
  ['Match draw', '0'],
  ['Clean sheet', '+4'],
  ['Goal conceded', '-1'],
  ['Match MVP', '+3'],
  ['Captain multiplier', '2×'],
];

const chipRows = [
  ['Manual bench substitute', '1 per gameweek'],
  ['Triple Captain', '1 per season'],
];

const TRANSFER_WINDOW_KEY = 'fn-pubg-fantasy-transfer-window';
const CHIP_WINDOW_KEY = 'fn-pubg-fantasy-chip-windows';

const GAMES = [
  { slug: 'fc-mobile', name: 'FC Mobile', category: 'football' },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', category: 'shooter' },
  { slug: 'free-fire', name: 'Free Fire', category: 'shooter' },
  { slug: 'efootball', name: 'eFootball', category: 'football' },
  { slug: 'ea-fc-26', name: 'EA FC 26', category: 'football' },
];

type Athlete = {
  id: string;
  name: string;
  ign?: string;
  known_name?: string | null;
  game_slug?: string;
  team?: string | null;
  role?: string | null;
  overall_rating?: number;
  fantasy_price?: number;
  recent_fantasy_points?: number | string | null;
  total_fantasy_points?: number | string | null;
  fantasy_status?: string;
};

type FootballStats = {
  appeared: boolean;
  goals: number;
  assists: number;
  result: 'win' | 'draw' | 'loss';
  cleanSheet: boolean;
  goalsConceded: number;
  mvp: boolean;
};

type ShooterStats = {
  participated: boolean;
  kills: number;
  topThree: boolean;
  matchWin: boolean;
  mvp: boolean;
};

function calcFootballPoints(stats: FootballStats): number {
  let pts = 0;
  if (stats.appeared) pts += 1;
  pts += (Number(stats.goals) || 0) * 5;
  pts += (Number(stats.assists) || 0) * 3;
  if (stats.result === 'win') pts += 3;
  else if (stats.result === 'loss') pts -= 1;
  if (stats.cleanSheet) pts += 4;
  pts += (Number(stats.goalsConceded) || 0) * -1;
  if (stats.mvp) pts += 3;
  return pts;
}

function calcShooterPoints(stats: ShooterStats): number {
  let pts = 0;
  if (stats.participated) pts += 1;
  pts += (Number(stats.kills) || 0) * 2;
  if (stats.matchWin) pts += 10;
  else if (stats.topThree) pts += 5;
  if (stats.mvp) pts += 5;
  return pts;
}

export default function AdminFantasyPage() {
  const [transferStatus, setTransferStatus] = useState("closed");
  const [transfersRemaining, setTransfersRemaining] = useState("0");
  const [windowOpens, setWindowOpens] = useState("");
  const [windowCloses, setWindowCloses] = useState("");
  const [saved, setSaved] = useState(false);
  const [gameweekName, setGameweekName] = useState('');
  const [gameweekDeadline, setGameweekDeadline] = useState('');
  const [createdGameweeks, setCreatedGameweeks] = useState<{ id: string; name: string; deadline: string; status: string }[]>([]);
  const [chipWindows, setChipWindows] = useState({ triple_captain: { status: 'closed', opens: '', closes: '' }, manual_substitute: { status: 'closed', opens: '', closes: '' } });

  // Roster lock state per game
  const [rosterLocks, setRosterLocks] = useState<Record<string, boolean>>({
    'pubg-mobile': false,
    'fc-mobile': false,
    'free-fire': false,
  });
  const [lockUpdating, setLockUpdating] = useState<string | null>(null);
  const [lockToast, setLockToast] = useState('');

  // Athlete Points Entry state
  const [pointsGame, setPointsGame] = useState('fc-mobile');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  // Scoring tab in Scoring Configuration section
  const [scoringTab, setScoringTab] = useState<'fc-mobile' | 'pubg-mobile'>('fc-mobile');

  // Football scoring modal inputs
  const [footballForm, setFootballForm] = useState<FootballStats>({
    appeared: true,
    goals: 0,
    assists: 0,
    result: 'win',
    cleanSheet: false,
    goalsConceded: 0,
    mvp: false,
  });

  // Shooter scoring modal inputs
  const [shooterForm, setShooterForm] = useState<ShooterStats>({
    participated: true,
    kills: 0,
    topThree: false,
    matchWin: false,
    mvp: false,
  });

  const [overridePoints, setOverridePoints] = useState('');
  const [awardMode, setAwardMode] = useState<'add' | 'set'>('add');
  const [awarding, setAwarding] = useState(false);
  const [awardToast, setAwardToast] = useState('');
  const [awardError, setAwardError] = useState('');

  const loadAthletes = useCallback(async (gameSlug: string) => {
    setAthletesLoading(true);
    try {
      const res = await fetch(`/api/athletes?game_slug=${gameSlug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAthletes(Array.isArray(data) ? data : []);
      }
    } catch {
      setAthletes([]);
    } finally {
      setAthletesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAthletes(pointsGame);
  }, [pointsGame, loadAthletes]);

  useEffect(() => {
    const savedWindow = window.localStorage.getItem(TRANSFER_WINDOW_KEY);
    if (savedWindow) {
      try {
        const parsed = JSON.parse(savedWindow);
        setTransferStatus(parsed.status || "closed");
        setTransfersRemaining(String(parsed.transfersRemaining ?? "0"));
        setWindowOpens(parsed.opens || "");
        setWindowCloses(parsed.closes || "");
      } catch {}
    }
    const savedChips = window.localStorage.getItem(CHIP_WINDOW_KEY);
    if (savedChips) {
      try { setChipWindows(JSON.parse(savedChips)); } catch {}
    }

    // Fetch settings for all games to get roster lock status
    GAMES.slice(0, 3).forEach((g) => {
      fetch(`/api/fantasy/settings?game_slug=${g.slug}`, { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((settings) => {
          if (settings) {
            setRosterLocks((prev) => ({ ...prev, [g.slug]: Boolean(settings.roster_locked) }));
            if (g.slug === 'pubg-mobile') {
              if (settings.transferWindow) {
                setTransferStatus(settings.transferWindow.status || "closed");
                setTransfersRemaining(String(settings.transferWindow.transfersRemaining ?? "0"));
                setWindowOpens(settings.transferWindow.opens || "");
                setWindowCloses(settings.transferWindow.closes || "");
                window.localStorage.setItem(TRANSFER_WINDOW_KEY, JSON.stringify(settings.transferWindow));
              }
              if (settings.chipWindows) {
                setChipWindows(settings.chipWindows);
                window.localStorage.setItem(CHIP_WINDOW_KEY, JSON.stringify(settings.chipWindows));
              }
            }
          }
        })
        .catch(() => null);
    });
  }, []);

  async function toggleRosterLock(gameSlug: string) {
    const currentState = Boolean(rosterLocks[gameSlug]);
    const nextState = !currentState;
    setLockUpdating(gameSlug);
    try {
      const res = await fetch('/api/admin/fantasy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug, roster_locked: nextState }),
      });
      if (res.ok) {
        setRosterLocks((prev) => ({ ...prev, [gameSlug]: nextState }));
        const gameName = GAMES.find(g => g.slug === gameSlug)?.name || gameSlug;
        setLockToast(`${gameName} roster editing is now ${nextState ? 'LOCKED' : 'UNLOCKED'}.`);
        window.setTimeout(() => setLockToast(''), 3500);
      }
    } catch {} finally {
      setLockUpdating(null);
    }
  }

  async function saveTransferWindow() {
    const transferWindow = { gameSlug: "pubg-mobile", status: transferStatus, transfersRemaining: Number(transfersRemaining) || 0, opens: windowOpens, closes: windowCloses };
    window.localStorage.setItem(TRANSFER_WINDOW_KEY, JSON.stringify(transferWindow));
    window.localStorage.setItem(CHIP_WINDOW_KEY, JSON.stringify(chipWindows));
    await fetch("/api/admin/fantasy/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transferWindow, chipWindows }) }).catch(() => null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function updateChipWindow(chip: "triple_captain" | "manual_substitute", field: "status" | "opens" | "closes", value: string) {
    setChipWindows((current) => ({ ...current, [chip]: { ...current[chip], [field]: value } }));
  }

  function createOrUpdateGameweek() {
    const id = (gameweekName || "gameweek").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `gw-${Date.now()}`;
    setCreatedGameweeks((current) => [{ id, name: gameweekName || "New Gameweek", deadline: gameweekDeadline, status: "selection" }, ...current.filter((gw) => gw.id !== id)]);
  }

  function openAwardModal(athlete: Athlete) {
    setSelectedAthlete(athlete);
    setOverridePoints('');
    setAwardError('');
    setFootballForm({
      appeared: true,
      goals: 0,
      assists: 0,
      result: 'win',
      cleanSheet: false,
      goalsConceded: 0,
      mvp: false,
    });
    setShooterForm({
      participated: true,
      kills: 0,
      topThree: false,
      matchWin: false,
      mvp: false,
    });
  }

  const isCurrentFootball = isFootballGame(selectedAthlete?.game_slug || pointsGame);
  const calculatedPoints = useMemo(() => {
    if (overridePoints.trim() !== '' && Number.isFinite(Number(overridePoints))) {
      return Number(overridePoints);
    }
    return isCurrentFootball ? calcFootballPoints(footballForm) : calcShooterPoints(shooterForm);
  }, [overridePoints, isCurrentFootball, footballForm, shooterForm]);

  async function handleAwardPoints() {
    if (!selectedAthlete) return;
    setAwarding(true);
    setAwardError('');
    try {
      const res = await fetch('/api/admin/fantasy/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: selectedAthlete.id,
          points: calculatedPoints,
          mode: awardMode,
          stat_breakdown: isCurrentFootball ? footballForm : shooterForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to award fantasy points');

      const name = selectedAthlete.known_name || selectedAthlete.ign || selectedAthlete.name;
      setAwardToast(`Awarded ${calculatedPoints} PTS to ${name}! Recent: ${data.newRecent} PTS · Total: ${data.newTotal} PTS`);
      window.setTimeout(() => setAwardToast(''), 4500);

      // Update in local state
      setAthletes((prev) =>
        prev.map((a) =>
          a.id === selectedAthlete.id
            ? { ...a, recent_fantasy_points: data.newRecent, total_fantasy_points: data.newTotal }
            : a
        )
      );
      setSelectedAthlete(null);
    } catch (err: unknown) {
      setAwardError(err instanceof Error ? err.message : 'Error awarding points');
    } finally {
      setAwarding(false);
    }
  }

  const filteredAthletes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return athletes;
    return athletes.filter((a) =>
      [a.known_name, a.ign, a.name, a.team].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [athletes, searchQuery]);

  return (
    <div className="p-8 space-y-8">
      {/* Page Title & Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fn-gborder pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-fn-green">Fantasy League Admin</span>
            <span className="text-[10px] bg-fn-green/10 text-fn-green border border-fn-green/30 px-2 py-0.5 rounded-sm font-bold uppercase">
              Command Center
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-widest text-fn-text">
            Fantasy Scoring, Points Entry & Gameweeks
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-fn-muted">
            Award fantasy match points directly to athletes across Football (FC Mobile, eFootball, EA FC 26) and Shooter games (PUBG Mobile, Free Fire), configure scoring matrices, control roster locks, and run Gameweek matches.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/fantasy/fc-mobile"
            className="flex items-center gap-2 border border-fn-yellow/40 bg-fn-yellow/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-fn-yellow hover:bg-fn-yellow/20 transition-colors"
          >
            <Shield size={14} />
            FC Mobile Squad & Rules
            <ArrowRight size={12} />
          </Link>
          <Link
            href="/admin/athletes"
            className="flex items-center gap-2 border border-fn-gborder bg-fn-card px-4 py-2.5 text-xs font-black uppercase tracking-wider text-fn-muted hover:text-fn-text transition-colors"
          >
            All Athletes Admin
          </Link>
        </div>
      </div>

      {/* Roster Lock / Unlock Control Panel */}
      <section className="rounded-sm border border-fn-green/40 bg-fn-card p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-fn-green animate-pulse" />
              <p className="fn-label text-fn-green">Roster Editing Access Control</p>
            </div>
            <h2 className="mt-1 font-display text-xl font-black uppercase tracking-wide text-fn-text">
              Lock & Unlock User Roster Editing
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-fn-muted">
              Users can edit their rosters freely (swap starters, bench, captain, transfers) until you trigger the Lock button below.
            </p>
          </div>
        </div>

        {lockToast && (
          <div className="mt-3 flex items-center gap-2 border border-fn-green/50 bg-fn-green/10 p-3 text-xs font-bold uppercase tracking-wide text-fn-green">
            <CheckCircle2 size={16} />
            {lockToast}
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {GAMES.slice(0, 3).map((game) => {
            const isLocked = Boolean(rosterLocks[game.slug]);
            const isUpdating = lockUpdating === game.slug;
            return (
              <div
                key={game.slug}
                className={`relative flex flex-col justify-between border p-4 transition-all ${
                  isLocked ? 'border-fn-red/40 bg-fn-red/5' : 'border-fn-green/40 bg-fn-green/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-black uppercase text-fn-text">{game.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        isLocked
                          ? 'border-fn-red/50 bg-fn-red/20 text-fn-red'
                          : 'border-fn-green/50 bg-fn-green/20 text-fn-green'
                      }`}
                    >
                      {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                      {isLocked ? 'Rosters Locked' : 'Editing Open'}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-fn-muted">
                    {isLocked
                      ? 'Users are blocked from editing their squad, changing players, or confirming new lineups.'
                      : 'Users can freely edit starters, bench, captain, and lineup picks.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-fn-gborder">
                  <button
                    type="button"
                    onClick={() => toggleRosterLock(game.slug)}
                    disabled={isUpdating}
                    className={`w-full py-2.5 px-3 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                      isLocked
                        ? 'bg-fn-green text-fn-black hover:bg-fn-gdim'
                        : 'border border-fn-red/60 bg-fn-red/20 text-fn-red hover:bg-fn-red hover:text-white'
                    } disabled:opacity-50`}
                  >
                    {isUpdating ? (
                      'Updating...'
                    ) : isLocked ? (
                      <>
                        <Unlock size={14} /> Unlock Rosters (Allow Edits)
                      </>
                    ) : (
                      <>
                        <Lock size={14} /> Lock Rosters (Stop Edits)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── ATHLETE FANTASY POINTS ENTRY SECTION ── */}
      <section className="rounded-sm border border-fn-green/40 bg-fn-card p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fn-gborder pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="text-fn-green" size={20} />
              <p className="fn-label text-fn-green">Athlete Points Assignment</p>
            </div>
            <h2 className="mt-1 font-display text-xl font-black uppercase tracking-wide text-fn-text">
              Award & Manage Athlete Fantasy Points
            </h2>
            <p className="mt-1 text-xs text-fn-muted">
              Select an esports title below, pick an athlete, and award match points using either game-specific stat rules (Goals, Assists, Clean Sheet, Result for football; Kills, Placement for shooter) or direct points entry. Updates both Recent and Total fantasy points immediately.
            </p>
          </div>

          {/* Game Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {GAMES.map((game) => (
              <button
                key={game.slug}
                type="button"
                onClick={() => setPointsGame(game.slug)}
                className={`px-3 py-2 text-xs font-black uppercase tracking-wider border transition-all ${
                  pointsGame === game.slug
                    ? 'border-fn-green bg-fn-green text-fn-black shadow-[0_0_12px_rgba(77,255,110,0.3)]'
                    : 'border-fn-gborder bg-fn-black text-fn-muted hover:border-fn-green/40 hover:text-fn-text'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {awardToast && (
          <div className="mt-4 flex items-center gap-2 border border-fn-green/50 bg-fn-green/10 p-3 text-xs font-bold uppercase tracking-wide text-fn-green">
            <CheckCircle2 size={16} />
            {awardToast}
          </div>
        )}

        {/* Filter & Athlete Grid */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search athlete by name, IGN, or team..."
                className="w-full bg-fn-black border border-fn-gborder pl-9 pr-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-fn-muted">
              <span>Showing {filteredAthletes.length} athletes</span>
              <button
                type="button"
                onClick={() => loadAthletes(pointsGame)}
                className="inline-flex items-center gap-1 border border-fn-gborder px-2 py-1 text-[10px] uppercase font-bold text-fn-muted hover:text-fn-green"
              >
                <RefreshCw size={11} className={athletesLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {athletesLoading ? (
            <div className="py-12 text-center text-xs text-fn-muted uppercase tracking-widest animate-pulse">
              Loading athletes for {GAMES.find(g => g.slug === pointsGame)?.name}...
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div className="border border-fn-gborder bg-fn-black p-8 text-center text-xs text-fn-muted">
              No athletes found for {GAMES.find(g => g.slug === pointsGame)?.name}.
            </div>
          ) : (
            <div className="overflow-x-auto border border-fn-gborder bg-fn-black/40">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="bg-fn-dark text-left border-b border-fn-gborder text-fn-muted uppercase text-[10px] tracking-wider">
                    <th className="p-3">Athlete</th>
                    <th className="p-3">Role / Team</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Fantasy Price</th>
                    <th className="p-3">Recent Points</th>
                    <th className="p-3">Total Points</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fn-gborder">
                  {filteredAthletes.map((athlete) => {
                    const isFoot = isFootballGame(athlete.game_slug || pointsGame);
                    const name = athlete.known_name || athlete.ign || athlete.name;
                    return (
                      <tr key={athlete.id} className="hover:bg-fn-card/50 transition-colors">
                        <td className="p-3">
                          <p className="font-black uppercase text-fn-text">{name}</p>
                          {athlete.name && athlete.name !== name && (
                            <p className="text-[10px] text-fn-muted">{athlete.name}</p>
                          )}
                        </td>
                        <td className="p-3 text-fn-muted">
                          {isFoot ? (
                            <span className="text-[10px] border border-fn-gborder px-1.5 py-0.5 rounded-sm">
                              {athlete.role || 'Football Athlete'}
                            </span>
                          ) : (
                            <span>{athlete.team || 'Free Agent'} · {athlete.role || 'Player'}</span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-fn-text">
                          {athlete.overall_rating ?? '—'}
                        </td>
                        <td className="p-3 font-bold text-fn-green">
                          ₦{Number(athlete.fantasy_price || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-black text-fn-yellow text-sm">
                          {Number(athlete.recent_fantasy_points || 0)} PTS
                        </td>
                        <td className="p-3 font-black text-fn-green text-sm">
                          {Number(athlete.total_fantasy_points || 0)} PTS
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => openAwardModal(athlete)}
                            className="bg-fn-green/10 text-fn-green border border-fn-green/40 hover:bg-fn-green hover:text-fn-black px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                          >
                            <Award size={12} />
                            Award Points
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── POINTS AWARD MODAL / FORM ── */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl border border-fn-green/50 bg-fn-card p-6 shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setSelectedAthlete(null)}
              className="absolute right-4 top-4 text-fn-muted hover:text-fn-text"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="border-b border-fn-gborder pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-fn-green/40 bg-fn-green/10 text-fn-green">
                  {isCurrentFootball ? 'Football Points Entry' : 'Shooter Points Entry'}
                </span>
                <span className="text-xs text-fn-muted">
                  {GAMES.find(g => g.slug === (selectedAthlete.game_slug || pointsGame))?.name}
                </span>
              </div>
              <h3 className="mt-1 font-display text-xl font-black uppercase text-fn-text">
                Award Points: {selectedAthlete.known_name || selectedAthlete.ign || selectedAthlete.name}
              </h3>
              <p className="mt-1 text-xs text-fn-muted">
                Current Total: <strong className="text-fn-green">{Number(selectedAthlete.total_fantasy_points || 0)} PTS</strong> · Recent: <strong className="text-fn-yellow">{Number(selectedAthlete.recent_fantasy_points || 0)} PTS</strong>
              </p>
            </div>

            {awardError && (
              <div className="mt-4 flex items-center gap-2 border border-fn-red/40 bg-fn-red/10 p-3 text-xs text-fn-red">
                <AlertCircle size={14} />
                {awardError}
              </div>
            )}

            {/* Conditional Scoring Form */}
            {isCurrentFootball ? (
              <div className="mt-5 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-fn-green">
                  Football Match Performance Stats
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={footballForm.appeared}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, appeared: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Appeared</span>
                      <span className="text-[10px] text-fn-muted">+1 PT</span>
                    </div>
                  </label>

                  <label className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label block mb-1">Goals (+5 PTS)</span>
                    <input
                      type="number"
                      min="0"
                      value={footballForm.goals}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, goals: Math.max(0, Number(e.target.value)) }))}
                      className="w-full bg-fn-dark border border-fn-gborder px-2 py-1 text-sm font-bold text-fn-text outline-none focus:border-fn-green"
                    />
                  </label>

                  <label className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label block mb-1">Assists (+3 PTS)</span>
                    <input
                      type="number"
                      min="0"
                      value={footballForm.assists}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, assists: Math.max(0, Number(e.target.value)) }))}
                      className="w-full bg-fn-dark border border-fn-gborder px-2 py-1 text-sm font-bold text-fn-text outline-none focus:border-fn-green"
                    />
                  </label>

                  <label className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label block mb-1">Match Result</span>
                    <select
                      value={footballForm.result}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, result: e.target.value as FootballStats['result'] }))}
                      className="w-full bg-fn-dark border border-fn-gborder px-2 py-1 text-xs uppercase text-fn-text outline-none focus:border-fn-green"
                    >
                      <option value="win">Win (+3 PTS)</option>
                      <option value="draw">Draw (0 PTS)</option>
                      <option value="loss">Loss (-1 PT)</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={footballForm.cleanSheet}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, cleanSheet: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Clean Sheet</span>
                      <span className="text-[10px] text-fn-muted">+4 PTS</span>
                    </div>
                  </label>

                  <label className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label block mb-1">Conceded (-1 PT)</span>
                    <input
                      type="number"
                      min="0"
                      value={footballForm.goalsConceded}
                      onChange={(e) => setFootballForm(prev => ({ ...prev, goalsConceded: Math.max(0, Number(e.target.value)) }))}
                      className="w-full bg-fn-dark border border-fn-gborder px-2 py-1 text-sm font-bold text-fn-text outline-none focus:border-fn-green"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footballForm.mvp}
                    onChange={(e) => setFootballForm(prev => ({ ...prev, mvp: e.target.checked }))}
                    className="accent-fn-green h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-fn-text">Man of the Match / MVP (+3 PTS)</span>
                    <span className="text-[10px] text-fn-muted block">Bonus awarded to standout player</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-fn-green">
                  Shooter Match Performance Stats
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shooterForm.participated}
                      onChange={(e) => setShooterForm(prev => ({ ...prev, participated: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Played</span>
                      <span className="text-[10px] text-fn-muted">+1 PT</span>
                    </div>
                  </label>

                  <label className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label block mb-1">Kills (+2 PTS each)</span>
                    <input
                      type="number"
                      min="0"
                      value={shooterForm.kills}
                      onChange={(e) => setShooterForm(prev => ({ ...prev, kills: Math.max(0, Number(e.target.value)) }))}
                      className="w-full bg-fn-dark border border-fn-gborder px-2 py-1 text-sm font-bold text-fn-text outline-none focus:border-fn-green"
                    />
                  </label>

                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shooterForm.topThree}
                      onChange={(e) => setShooterForm(prev => ({ ...prev, topThree: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Top 3 Finish</span>
                      <span className="text-[10px] text-fn-muted">+5 PTS</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shooterForm.matchWin}
                      onChange={(e) => setShooterForm(prev => ({ ...prev, matchWin: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Match Win</span>
                      <span className="text-[10px] text-fn-muted">+10 PTS</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 border border-fn-gborder bg-fn-black p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shooterForm.mvp}
                      onChange={(e) => setShooterForm(prev => ({ ...prev, mvp: e.target.checked }))}
                      className="accent-fn-green h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-fn-text block">Match MVP</span>
                      <span className="text-[10px] text-fn-muted">+5 PTS</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Direct Points Override & Mode */}
            <div className="mt-4 border-t border-fn-gborder pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="fn-label">Direct Points Override (Optional)</label>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="awardMode"
                      value="add"
                      checked={awardMode === 'add'}
                      onChange={() => setAwardMode('add')}
                      className="accent-fn-green"
                    />
                    <span>Add to Total</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="awardMode"
                      value="set"
                      checked={awardMode === 'set'}
                      onChange={() => setAwardMode('set')}
                      className="accent-fn-green"
                    />
                    <span>Set Exact Total</span>
                  </label>
                </div>
              </div>

              <input
                type="number"
                value={overridePoints}
                onChange={(e) => setOverridePoints(e.target.value)}
                placeholder="Leave blank to use calculated stats above"
                className="w-full bg-fn-dark border border-fn-gborder px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green"
              />
            </div>

            {/* Calculation Readout Box */}
            <div className="mt-4 border border-fn-green/30 bg-fn-green/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-fn-green tracking-wider">
                    Calculated Points to Award
                  </span>
                  <p className="font-display text-2xl font-black text-fn-text">
                    {calculatedPoints} PTS
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-fn-muted block">Projected Total</span>
                  <span className="font-bold text-fn-green">
                    {awardMode === 'set'
                      ? calculatedPoints
                      : (Number(selectedAthlete.total_fantasy_points || 0) + calculatedPoints)}{' '}
                    PTS
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-fn-muted">
                {isCurrentFootball
                  ? `Formula: Appeared (${footballForm.appeared ? 1 : 0}) + Goals (${footballForm.goals} × 5) + Assists (${footballForm.assists} × 3) + Result (${footballForm.result === 'win' ? '+3' : footballForm.result === 'loss' ? '-1' : '0'}) + Clean Sheet (${footballForm.cleanSheet ? 4 : 0}) + Conceded (${footballForm.goalsConceded} × -1) + MVP (${footballForm.mvp ? 3 : 0})`
                  : `Formula: Played (${shooterForm.participated ? 1 : 0}) + Kills (${shooterForm.kills} × 2) + Top 3 (${shooterForm.topThree ? 5 : 0}) + Win (${shooterForm.matchWin ? 10 : 0}) + MVP (${shooterForm.mvp ? 5 : 0})`}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAthlete(null)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-fn-muted hover:text-fn-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAwardPoints}
                disabled={awarding}
                className="bg-fn-green px-5 py-2.5 text-xs font-black uppercase tracking-wider text-fn-black hover:bg-fn-gdim transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Award size={14} />
                {awarding ? 'Saving...' : 'Confirm & Award Points'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCORING CONFIGURATION & OTHER MODULES ── */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-sm border border-fn-gborder bg-fn-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-black uppercase text-fn-text">Scoring Configuration</h2>
              <p className="text-[10px] text-fn-muted">Standard rule matrix by game category</p>
            </div>
            {/* Scoring category switch */}
            <div className="inline-flex border border-fn-gborder bg-fn-black p-0.5 text-[10px] font-black uppercase">
              <button
                type="button"
                onClick={() => setScoringTab('fc-mobile')}
                className={`px-3 py-1 ${scoringTab === 'fc-mobile' ? 'bg-fn-green text-fn-black' : 'text-fn-muted'}`}
              >
                FC Mobile (Football)
              </button>
              <button
                type="button"
                onClick={() => setScoringTab('pubg-mobile')}
                className={`px-3 py-1 ${scoringTab === 'pubg-mobile' ? 'bg-fn-green text-fn-black' : 'text-fn-muted'}`}
              >
                Shooter
              </button>
            </div>
          </div>

          {scoringTab === 'fc-mobile' ? (
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {footballScoringRows.map(([label, value]) => (
                  <div key={label} className="border border-fn-gborder bg-fn-black p-3 flex items-center justify-between">
                    <span className="fn-label text-fn-text">{label}</span>
                    <span className="font-bold text-fn-green">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-fn-gborder flex items-center justify-between">
                <p className="text-[10px] text-fn-muted">Configured for FC Mobile, eFootball, and EA FC 26</p>
                <Link
                  href="/admin/fantasy/fc-mobile"
                  className="text-xs font-bold uppercase tracking-wider text-fn-green hover:underline inline-flex items-center gap-1"
                >
                  Edit FC Mobile Rules →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {shooterScoringRows.map(([label, value]) => (
                  <label key={label} className="border border-fn-gborder bg-fn-black p-3">
                    <span className="fn-label">{label}</span>
                    <input defaultValue={value} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-sm text-fn-text outline-none focus:border-fn-green" />
                  </label>
                ))}
              </div>
              <p className="mt-3 border border-fn-green/20 bg-fn-green/10 px-3 py-2 text-[10px] leading-relaxed text-fn-green">
                Default placement behavior is mutually exclusive: a match win uses Match win value, 2nd/3rd use Top 3 finish.
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-fn-gborder">
            <span className="fn-label block mb-2">Chip Usage Limits</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {chipRows.map(([label, value]) => (
                <div key={label} className="border border-fn-gborder bg-fn-black p-3 flex items-center justify-between">
                  <span className="fn-label text-fn-text">{label}</span>
                  <span className="font-bold text-fn-green">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Manage Gameweeks */}
        <section className="rounded-sm border border-fn-gborder bg-fn-card p-5">
          <h2 className="font-display text-lg font-black uppercase text-fn-text">Manage Gameweeks & Matches</h2>
          <p className="mt-1 text-xs text-fn-muted">
            Open Gameweek match lists to score matches across FC Mobile and PUBG Mobile.
          </p>
          <div className="mt-4 grid gap-3">
            <input value={gameweekName} onChange={(event) => setGameweekName(event.target.value)} placeholder="Gameweek name (e.g. Gameweek #6)" className="border border-fn-gborder bg-fn-black px-3 py-2.5 text-xs outline-none focus:border-fn-green" />
            <input value={gameweekDeadline} onChange={(event) => setGameweekDeadline(event.target.value)} type="datetime-local" className="border border-fn-gborder bg-fn-black px-3 py-2 text-xs outline-none focus:border-fn-green" />
            <button type="button" onClick={createOrUpdateGameweek} className="bg-fn-green px-4 py-2.5 text-xs font-black uppercase tracking-widest text-fn-black">Create / Update Gameweek</button>
            {createdGameweeks.map((gw) => (
              <Link key={gw.id} href={`/admin/fantasy/gameweeks/${gw.id}`} className="border border-fn-green/40 bg-fn-green/10 px-3 py-2.5 text-xs font-black uppercase text-fn-green flex items-center justify-between">
                <span>Open {gw.name} Matches</span>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <p className="fn-label text-fn-muted mb-1">Active Gameweek Fixtures</p>
            {['Gameweek #4', 'Gameweek #5'].map((name, index) => (
              <Link key={name} href={`/admin/fantasy/gameweeks/gw-${index + 4}`} className="flex items-center justify-between border border-fn-gborder bg-fn-black px-3 py-3 hover:border-fn-green transition-colors">
                <div>
                  <span className="text-xs font-black uppercase text-fn-text block">{name}</span>
                  <span className="text-[10px] text-fn-muted">FC Mobile & PUBG Mobile Fixtures</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-fn-green flex items-center gap-1">
                  Open Matches <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Chip Windows */}
        <section className="rounded-sm border border-fn-gborder bg-fn-card p-5">
          <h2 className="font-display text-lg font-black uppercase text-fn-text">Chip Availability Windows</h2>
          <p className="mt-2 text-xs text-fn-muted">Open or close the user-facing Triple Captain and Manual Substitute controls.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["triple_captain", "manual_substitute"] as const).map((chip) => (
              <div key={chip} className="border border-fn-gborder bg-fn-black p-3">
                <p className="fn-label text-fn-green">{chip.replace(/_/g, " ")}</p>
                <select value={chipWindows[chip].status} onChange={(event) => updateChipWindow(chip, "status", event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs uppercase text-fn-text outline-none focus:border-fn-green">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <input type="datetime-local" value={chipWindows[chip].opens} onChange={(event) => updateChipWindow(chip, "opens", event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green" />
                <input type="datetime-local" value={chipWindows[chip].closes} onChange={(event) => updateChipWindow(chip, "closes", event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green" />
              </div>
            ))}
          </div>
        </section>

        {/* Transfer Week Window */}
        <section className="rounded-sm border border-fn-green/30 bg-fn-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="fn-label text-fn-green">PUBG Mobile Transfer Control</p>
              <h2 className="font-display text-lg font-black uppercase text-fn-text">Transfer Week Window</h2>
            </div>
            <CalendarClock size={18} className="text-fn-green" />
          </div>
          <p className="text-xs leading-relaxed text-fn-muted">
            Controls scheduled transfer periods for PUBG Mobile squads. When locked above, editing is blocked immediately regardless of window schedules.
          </p>
          <div className="mt-3 inline-flex border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-green">
            Current status: {transferStatus}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="border border-fn-gborder bg-fn-black p-3">
              <span className="fn-label">Manual status</span>
              <select value={transferStatus} onChange={(event) => setTransferStatus(event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs uppercase text-fn-text outline-none focus:border-fn-green">
                <option value="open">Open transfer window</option>
                <option value="closed">Close transfer window</option>
                <option value="scheduled">Schedule transfer window</option>
              </select>
            </label>
            <label className="border border-fn-gborder bg-fn-black p-3">
              <span className="fn-label">Transfers remaining</span>
              <input type="number" min="0" value={transfersRemaining} onChange={(event) => setTransfersRemaining(event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green" />
            </label>
            <label className="border border-fn-gborder bg-fn-black p-3">
              <span className="fn-label">Window opens</span>
              <input type="datetime-local" value={windowOpens} onChange={(event) => setWindowOpens(event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green" />
            </label>
            <label className="border border-fn-gborder bg-fn-black p-3">
              <span className="fn-label">Window closes</span>
              <input type="datetime-local" value={windowCloses} onChange={(event) => setWindowCloses(event.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none focus:border-fn-green" />
            </label>
          </div>
          <button type="button" onClick={saveTransferWindow} className="mt-4 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black">
            {saved ? "Transfer window saved" : "Save transfer window"}
          </button>
        </section>
      </div>
    </div>
  );
}
