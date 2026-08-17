'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Gamepad2, Lock, Search, User } from 'lucide-react';
import { GAMES, type Game, type GameMode } from '@/lib/games';
import { useGame } from '@/context/GameContext';

type AuthUser = { id?: string; email?: string; username?: string } | null;
type Athlete = { id: string; name?: string | null; ign?: string | null; known_name?: string | null; role?: string | null; status?: string | null; game_slug?: string | null };

function useAuthGate() {
  const [user, setUser] = useState<AuthUser | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (active) setUser(payload ?? null); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  return { user, loading: user === undefined };
}

function LoginGate() {
  return <main className="min-h-screen bg-fn-black px-4 py-16 text-fn-text"><section className="mx-auto max-w-xl border border-fn-green/30 bg-fn-card p-6 text-center"><User className="mx-auto text-fn-green" size={28} /><p className="fn-label mt-4 text-fn-green">Login Required</p><h1 className="mt-2 font-display text-3xl font-black uppercase tracking-widest">Select a game first</h1><p className="mt-3 text-xs leading-relaxed text-fn-muted">Log in to open any individual game space from Virtual Games. This uses the existing Supabase session checked by /api/auth/me, the same authenticated session source used by wallet and wager actions.</p><Link href="/login" className="mt-5 inline-flex bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Login / Sign Up</Link></section></main>;
}

function ModeCard({ mode, game, compact = false }: { mode: GameMode; game: Game; compact?: boolean }) {
  const ready = mode.status === 'live' && Boolean(mode.route);
  const className = `border ${compact ? 'p-3' : 'p-4'} text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green ${ready ? 'bg-fn-green/10 text-fn-text hover:bg-fn-green/20' : 'border-fn-gborder bg-fn-card text-fn-muted opacity-60'}`;
  const style = ready ? { borderColor: game.colors.primary } : undefined;
  const content = <><div className="flex items-center justify-between gap-3"><span className="font-black uppercase tracking-wider">{mode.label}</span>{ready ? <Gamepad2 style={{ color: game.colors.primary }} /> : <Lock className="text-fn-muted" />}</div><p className="mt-2 text-xs uppercase tracking-widest text-fn-muted">{ready ? `${mode.variant ?? 'Mode'} · Live now` : `${mode.variant ?? 'Mode'} · TBD / Coming Soon`}</p></>;

  return ready ? <Link href={mode.route!} className={className} style={style} aria-label={`Open ${mode.label} mode`}>{content}</Link> : <button type="button" disabled className={className}>{content}</button>;
}

function ModesMenu({ game }: { game: Game }) {
  const [showUpcoming, setShowUpcoming] = useState(false);
  const liveModes = game.modes.filter((mode) => mode.status === 'live' && mode.route);
  const upcomingModes = game.modes.filter((mode) => mode.status !== 'live' || !mode.route);

  return (
    <section className="space-y-4">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="fn-label" style={{ color: game.colors.primary }}>Live now</p>
            <h2 className="text-sm font-black uppercase tracking-widest text-fn-text">Playable modes</h2>
          </div>
          <span className="border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-fn-green">{liveModes.length} active</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {liveModes.map((mode) => <ModeCard key={mode.key} mode={mode} game={game} />)}
        </div>
      </div>

      {upcomingModes.length > 0 && (
        <div className="border border-fn-gborder bg-fn-card/80">
          <button
            type="button"
            onClick={() => setShowUpcoming((open) => !open)}
            aria-expanded={showUpcoming}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green"
          >
            <div>
              <p className="fn-label" style={{ color: game.colors.primary }}>{showUpcoming ? 'Hide upcoming modes' : 'Show upcoming modes'}</p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-fn-muted">{upcomingModes.length} locked / coming soon</p>
            </div>
            <motion.span animate={{ rotate: showUpcoming ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex h-9 w-9 items-center justify-center border border-fn-gborder bg-fn-black text-fn-green">
              <ChevronDown size={16} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {showUpcoming && (
              <motion.div
                key="upcoming-modes"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-fn-gborder"
              >
                <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingModes.map((mode) => <ModeCard key={mode.key} mode={mode} game={game} compact />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function MortalKombatListing({ game }: { game: Game }) {
  const [search, setSearch] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/athletes?game_slug=${encodeURIComponent(game.slug)}&is_icon=false`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : []))
      .then((payload) => { if (active) setAthletes(Array.isArray(payload) ? payload : []); })
      .catch(() => { if (active) setAthletes([]); });
    return () => { active = false; };
  }, [game.slug]);

  const visibleAthletes = useMemo(() => athletes.filter((athlete) => `${athlete.name ?? ''} ${athlete.ign ?? ''} ${athlete.known_name ?? ''}`.toLowerCase().includes(search.toLowerCase())), [athletes, search]);

  return <section className="border border-fn-gborder bg-fn-card p-4"><p className="fn-label" style={{ color: game.colors.primary }}>Mortal Kombat Roster</p><h1 className="mt-2 text-2xl font-black uppercase tracking-widest">Fighter Listing</h1><p className="mt-2 text-xs leading-relaxed text-fn-muted">Mortal Kombat intentionally has no Choose Mode list yet. This scoped listing shows only athletes tagged with <span style={{ color: game.colors.primary }}>{game.slug}</span> while the final listing format is confirmed.</p><div className="mt-4 flex items-center gap-2 border border-fn-gborder bg-fn-black px-3 py-2"><Search size={14} style={{ color: game.colors.primary }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fighters" className="w-full bg-transparent text-xs outline-none" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{visibleAthletes.length ? visibleAthletes.map((athlete) => <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="border border-fn-gborder bg-fn-black p-3 hover:border-fn-green/40"><p className="text-xs font-black uppercase text-fn-text">{athlete.ign || athlete.known_name || athlete.name || 'Unknown Fighter'}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">{athlete.role || 'Player'} · {athlete.status || 'Published'}</p></Link>) : <p className="border border-dashed border-fn-gborder p-4 text-xs text-fn-muted">No Mortal Kombat athletes found yet.</p>}</div></section>;
}

export default function GamesPage() {
  const { selectedGame, isHydrated } = useGame();
  const { user, loading } = useAuthGate();
  const activeGame = selectedGame ?? GAMES[0];

  if (!isHydrated || loading) return <main className="min-h-screen bg-fn-black px-4 py-16 text-fn-muted">Checking game access…</main>;
  if (!user) return <LoginGate />;

  return <main className="min-h-screen bg-fn-black px-4 py-8 text-fn-text"><div className="mx-auto max-w-5xl space-y-6"><div><p className="fn-label" style={{ color: activeGame.colors.primary }}>Virtual Games · {activeGame.name}</p><h1 className="text-2xl font-black uppercase tracking-widest">{activeGame.hasModeMenu ? 'Choose Mode' : 'Roster'}</h1><p className="mt-2 text-xs text-fn-muted">Virtual game modes are scoped to the active game context. Switch games from the game picker to see another title&apos;s modes.</p></div>{activeGame.hasModeMenu ? <ModesMenu game={activeGame} /> : <MortalKombatListing game={activeGame} />}</div></main>;
}
