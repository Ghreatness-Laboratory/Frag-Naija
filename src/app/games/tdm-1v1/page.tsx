'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, Shield, X, Play } from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { useAthletes } from '@/lib/hooks';
import { useGame } from '@/context/GameContext';
import { GAMES } from '@/lib/games';
import { calculateDuelOddsFromKd, kdOf } from '@/lib/duel-odds';
import { DuelSimViewer, type DuelPlayer } from '@/components/common/DuelSimViewer';
import RouteLoadingScreen from '@/components/common/RouteLoadingScreen';

type Athlete = { id:string; name:string; ign?:string|null; known_name?:string|null; team?:string|null; role?:string|null; status?:string|null; photo_url?:string|null; jersey_number?:number|string|null; overall_rating?:number|string|null; rating?:number|string|null; kills?:number|string|null; attack?:number|null; defense?:number|null; survival?:number|null; clutch?:number|null; iq?:number|null; game_slug?:string|null; is_icon?:boolean|null };
type Duel = { id:string; odds_a:number|string; odds_b:number|string };
type PlacedWager = { id:string; potential_payout:number|string; stake?:number|string };

type Step = 'grid' | 'reveal' | 'wager' | 'wagerLocked' | 'matchSim' | 'result';

const SIGNAL = '#4dff6e';
const EMBER = '#ff5a3c';

function displayName(athlete?: Athlete | null) { return athlete?.known_name || athlete?.ign || athlete?.name || 'Empty Slot'; }
function ratingOf(athlete?: Athlete | null) { return Number(athlete?.overall_rating ?? athlete?.rating ?? 0); }
function portrait(athlete?: Athlete | null) { return athlete?.photo_url || ''; }
function getStats(athlete?: Athlete | null) {
  return {
    attack: Number(athlete?.attack ?? athlete?.kills ?? 50),
    defense: Number(athlete?.defense ?? athlete?.survival ?? 50),
    iq: Number(athlete?.iq ?? athlete?.clutch ?? 50)
  };
}

function Slot({ athlete, label }: { athlete: Athlete | null; label: string }) {
  return (
    <div className={`min-h-[58px] border border-dashed p-2 ${athlete ? 'border-solid border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-card'}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fn-muted">{label}</p>
      {athlete ? <p className="mt-1 truncate bg-fn-green px-2 py-1 text-xs font-black uppercase text-fn-black">{displayName(athlete)}</p> : <p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">Awaiting pick</p>}
    </div>
  );
}

function RosterTile({ athlete, selected, index, onClick, reduceMotion }: { athlete: Athlete; selected: boolean; index: number; onClick: () => void; reduceMotion: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={reduceMotion ? undefined : { delay: index * 0.025, duration: 0.26 }}
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      aria-pressed={selected}
      className={`group relative aspect-[3/4] overflow-hidden border bg-fn-card text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green ${selected ? 'border-fn-green' : 'border-fn-gborder hover:border-fn-green'}`}
    >
      {portrait(athlete) ? <img src={portrait(athlete)} alt={displayName(athlete)} className={`h-full w-full object-cover transition duration-300 ${selected ? 'scale-[1.06] grayscale-0 brightness-[.8]' : 'grayscale brightness-50 group-hover:scale-[1.06] group-hover:grayscale-0 group-hover:brightness-[.8]'}`} /> : <div className="flex h-full w-full items-center justify-center text-fn-muted"><Shield /></div>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-1.5 pb-1.5 pt-[48%]">
        <p className="truncate text-[8px] font-black uppercase tracking-wider text-fn-text sm:text-[9px]">{displayName(athlete)}</p>
      </div>
      {selected && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-fn-black bg-fn-green text-fn-black"><Check size={13} strokeWidth={4} /></span>}
    </motion.button>
  );
}


function preloadRosterPortraits(roster: Athlete[]) {
  if (typeof window === 'undefined') return Promise.resolve();
  const portraits = roster.map((athlete) => portrait(athlete)).filter(Boolean);
  return Promise.allSettled(
    portraits.map((src) => new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => {
        if ('decode' in image) {
          image.decode().then(resolve).catch(resolve);
        } else {
          resolve();
        }
      };
      image.onerror = () => resolve();
      image.src = src;
    }))
  ).then(() => undefined);
}

function RevealFighter({ athlete, odds, side, reduceMotion, onPick, picked }: { athlete: Athlete; odds: number; side: 'left' | 'right'; reduceMotion: boolean; onPick: () => void; picked: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { x: side === 'left' ? '-120%' : '120%', filter: 'blur(14px)', opacity: 0 }}
      animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }}
      transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.2, 1.4, 0.4, 1] }}
      className="flex flex-col items-center gap-3"
    >
      <div className="w-full max-w-[260px] aspect-[3/4] border border-fn-gborder bg-fn-card overflow-hidden">
        {portrait(athlete) ? <img src={portrait(athlete)} alt="" className="h-full w-full object-cover brightness-[.8]" /> : <PlayerCardTemplate athlete={{ ...athlete, ign: athlete.ign || athlete.name }} rating={ratingOf(athlete)} primary={SIGNAL} gameName="TDM 1V1" variant="featured" className="h-full" />}
      </div>
      <h2 className="text-center text-xl font-black uppercase tracking-widest text-fn-text">{displayName(athlete)}</h2>
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-fn-muted">K/D {kdOf(athlete).toFixed(2)} · Odds <span className="text-fn-green">{odds.toFixed(2)}x</span></p>
      <button type="button" onClick={onPick} className={`w-full max-w-[260px] border px-4 py-3 text-xs font-black uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green ${picked ? 'border-fn-green bg-fn-green text-fn-black' : 'border-fn-gborder bg-fn-card text-fn-text hover:border-fn-green'}`}>Back {displayName(athlete)}</button>
    </motion.div>
  );
}

export default function TdmOneVOnePage() {
  const reduceMotion = Boolean(useReducedMotion());
  const { selectedGame, isHydrated } = useGame();
  const activeGame = selectedGame ?? GAMES[0];
  const gameSlug = activeGame.slug;
  const { data: athletes = [], loading } = useAthletes({ game_slug: isHydrated ? gameSlug : '' }) as { data: Athlete[] | null; loading: boolean };
  const roster = useMemo(() => (athletes || []).filter((a) => !a.game_slug || a.game_slug === gameSlug), [athletes, gameSlug]);
  const [p1, setP1] = useState<Athlete | null>(null);
  const [p2, setP2] = useState<Athlete | null>(null);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [step, setStep] = useState<Step>('grid');
  const [picked, setPicked] = useState<'a' | 'b'>('a');
  const [stake, setStake] = useState('');
  const [placed, setPlaced] = useState<PlacedWager | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rosterReady, setRosterReady] = useState(false);
  const [matchResult, setMatchResult] = useState<{ winner: 'a' | 'b'; kills: number; mvp?: DuelPlayer } | null>(null);

  const previewOdds = p1 && p2 ? calculateDuelOddsFromKd(kdOf(p1), kdOf(p2)) : { odds_a: 0, odds_b: 0 };
  const oddsA = Number(duel?.odds_a ?? previewOdds.odds_a);
  const oddsB = Number(duel?.odds_b ?? previewOdds.odds_b);
  const both = Boolean(p1 && p2);
  const pickedOdds = picked === 'a' ? oddsA : oddsB;
  const pickedAthlete = picked === 'a' ? p1 : p2;

  useEffect(() => {
    let cancelled = false;
    setRosterReady(false);

    if (loading || !isHydrated) return () => { cancelled = true; };

    const minimumLoaderTime = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 700);
    });

    Promise.all([preloadRosterPortraits(roster), minimumLoaderTime]).then(() => {
      if (!cancelled) setRosterReady(true);
    });

    return () => { cancelled = true; };
  }, [loading, isHydrated, roster]);

  function toggle(a: Athlete) {
    setError('');
    if (step !== 'grid' || saving) return;
    if (p1?.id === a.id) setP1(null);
    else if (p2?.id === a.id) setP2(null);
    else if (!p1) setP1(a);
    else if (!p2) setP2(a);
  }

  async function confirm() {
    if (!p1 || !p2) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/duels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_a_id: p1.id, player_b_id: p2.id, game_slug: gameSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create duel');
      setDuel(data);
      setPicked('a');
      setStep('reveal');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create duel');
    } finally {
      setSaving(false);
    }
  }

  function back() {
    if (step === 'reveal') { setStep('grid'); setDuel(null); }
    else if (step === 'wager') setStep('reveal');
    else if (step === 'wagerLocked') setStep('wager');
    else if (step === 'matchSim' || step === 'result') setStep('wagerLocked');
  }

  function fullReset() {
    setP1(null);
    setP2(null);
    setStep('grid');
    setDuel(null);
    setPicked('a');
    setStake('');
    setPlaced(null);
    setModal(false);
    setError('');
    setMatchResult(null);
  }

  function placeWager() {
    if (!duel || !stake) return;
    setSaving(true);
    setError('');
    // Simulate wager placement for demo
    setTimeout(() => {
      setPlaced({ id: 'demo-wager', potential_payout: String(Number(stake) * pickedOdds), stake });
      setStep('wagerLocked');
      setSaving(false);
    }, 800);
  }

  function handleWatchMatch() {
    setStep('matchSim');
  }

  function handleSkipToResult() {
    const winner = Math.random() > 0.5 ? 'a' : 'b';
    const kills = 8 + Math.floor(Math.random() * 5);
    setMatchResult({ winner, kills, mvp: undefined });
    setStep('result');
  }

  function handleMatchEnd(result: { winner: 'a' | 'b'; kills: number; mvp?: DuelPlayer }) {
    setMatchResult(result);
    setStep('result');
  }

  function handleReturnHome() {
    window.location.href = '/games';
  }

  return (
    <main className="min-h-screen bg-fn-black text-fn-text">
      {step === 'grid' ? (
        <AnimatePresence mode="wait">
          {!rosterReady ? (
            <RouteLoadingScreen subtitle="LOADING MATCHUP" ariaLabel="Loading TDM 1V1 matchup" reduceMotion={reduceMotion} loaderKey="tdm-loader" />
          ) : (
        <motion.section
          key="tdm-grid"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.32 }}
          className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6"
        >
          <Link href="/games" className="mb-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-fn-green">
            <ChevronLeft size={13} /> Games
          </Link>
          <div className="mb-3">
            <p className="fn-label">TDM 1V1</p>
            <h1 className="text-2xl font-black uppercase tracking-widest sm:text-4xl">Select Athletes</h1>
          </div>
          <div className="sticky top-14 z-20 mb-3 border border-fn-gborder bg-fn-card/95 p-2 backdrop-blur">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Slot athlete={p1} label="P1" />
              <div className={`text-sm font-black ${both ? 'text-fn-green drop-shadow-[0_0_10px_rgb(77_255_110)]' : 'text-fn-muted'}`}>VS</div>
              <Slot athlete={p2} label="P2" />
            </div>
            <AnimatePresence>
              {both && (
                <motion.button
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  type="button"
                  onClick={confirm}
                  disabled={saving}
                  className="mt-2 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green disabled:opacity-60"
                >
                  {saving ? 'Confirming...' : 'Confirm Matchup'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          {error && <p className="mb-3 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
          <div className="grid grid-cols-4 gap-[6px] md:grid-cols-6 xl:grid-cols-8">
            {loading && Array.from({ length: 24 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse border border-fn-gborder bg-fn-card" />)}
            {!loading && roster.map((a, i) => (
              <RosterTile key={a.id} athlete={a} index={i} selected={p1?.id === a.id || p2?.id === a.id} reduceMotion={reduceMotion} onClick={() => toggle(a)} />
            ))}
          </div>
        </motion.section>
          )}
        </AnimatePresence>
      ) : step === 'reveal' && p1 && p2 ? (
        <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_center,#0f1710_0%,#050704_72%)] px-4 py-6">
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute inset-0 z-20 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.5, times: [0, 0.35, 0.65, 1] }}
              />
              <motion.div
                className="absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent,#4dff6e22,transparent,#4dff6e18,transparent)]"
                initial={{ scale: 0.6, rotate: 0 }}
                animate={{ scale: 1, rotate: 20 }}
                transition={{ duration: 1.4 }}
              />
            </>
          )}
          <div className="absolute -left-20 top-1/4 h-1 w-[70vw] rotate-[-18deg] bg-fn-green/20 blur-sm" />
          <div className="absolute -right-20 bottom-1/4 h-1 w-[70vw] rotate-[-18deg] bg-fn-green/20 blur-sm" />
          <button type="button" onClick={back} className="relative z-30 mb-8 text-xs font-black uppercase tracking-widest text-fn-text hover:text-fn-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-fn-green">
            ← Back
          </button>
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* Athlete A Stats Reveal */}
            <motion.div
              initial={reduceMotion ? false : { x: '-120%', filter: 'blur(14px)', opacity: 0 }}
              animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.2, 1.4, 0.4, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative w-full max-w-[220px] aspect-[3/4] overflow-hidden border border-fn-gborder bg-fn-card">
                {portrait(p1) ? (
                  <img src={portrait(p1)} alt="" className="h-full w-full object-cover brightness-[.85]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-fn-green"><Shield size={48} /></div>
                )}
                <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-fn-green bg-fn-black/90">
                  <span className="text-sm font-black text-fn-green">{ratingOf(p1)}</span>
                </div>
              </div>
              <h2 className="text-center text-lg font-black uppercase tracking-wider text-fn-text">{displayName(p1).split(' ').pop() || displayName(p1)}</h2>
              <div className="grid w-full max-w-[220px] grid-cols-3 gap-1.5">
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Zap size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">ATK</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p1).attack}</p>
                </div>
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Shield size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">DEF</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p1).defense}</p>
                </div>
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Brain size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">IQ</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p1).iq}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-center text-[42px] font-black text-fn-green drop-shadow-[0_0_18px_rgb(77_255_110)] motion-safe:animate-pulse"
            >
              VS
            </motion.div>

            {/* Athlete B Stats Reveal */}
            <motion.div
              initial={reduceMotion ? false : { x: '120%', filter: 'blur(14px)', opacity: 0 }}
              animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }}
              transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.2, 1.4, 0.4, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative w-full max-w-[220px] aspect-[3/4] overflow-hidden border border-fn-gborder bg-fn-card">
                {portrait(p2) ? (
                  <img src={portrait(p2)} alt="" className="h-full w-full object-cover brightness-[.85]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-fn-green"><Shield size={48} /></div>
                )}
                <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-sm border-2 border-fn-green bg-fn-black/90">
                  <span className="text-sm font-black text-fn-green">{ratingOf(p2)}</span>
                </div>
              </div>
              <h2 className="text-center text-lg font-black uppercase tracking-wider text-fn-text">{displayName(p2).split(' ').pop() || displayName(p2)}</h2>
              <div className="grid w-full max-w-[220px] grid-cols-3 gap-1.5">
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Zap size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">ATK</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p2).attack}</p>
                </div>
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Shield size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">DEF</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p2).defense}</p>
                </div>
                <div className="border border-fn-gborder bg-fn-card/50 p-2">
                  <div className="flex items-center gap-1.5"><Brain size={12} className="text-fn-green" /><p className="text-[9px] font-black uppercase tracking-widest text-fn-muted">IQ</p></div>
                  <p className="mt-1 text-lg font-black text-fn-green">{getStats(p2).iq}</p>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="relative z-10 mx-auto mt-8 max-w-md"
          >
            <button
              type="button"
              onClick={() => setStep('wager')}
              className="w-full bg-fn-green px-4 py-4 text-sm font-black uppercase tracking-widest text-fn-black"
            >
              Continue with Athletes
            </button>
          </motion.div>
        </section>
      ) : step === 'wager' && p1 && p2 ? (
        <motion.section key="wager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8">
          <button type="button" onClick={back} className="mb-6 text-left text-xs font-black uppercase tracking-widest text-fn-text hover:text-fn-green">← Back</button>
          <div className="border border-fn-gborder bg-fn-card p-5">
            <p className="fn-label">TDM 1V1 DUEL</p>
            <h1 className="mt-1 text-xl font-black uppercase tracking-widest">{displayName(p1)} vs {displayName(p2)}</h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[['a', p1, oddsA], ['b', p2, oddsB]].map(([side, athlete, odd]) => (
                <button
                  key={side as string}
                  type="button"
                  onClick={() => setPicked(side as 'a'|'b')}
                  className={`border p-3 text-left ${picked === side ? 'border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-dark'}`}
                >
                  <p className="text-xs font-black uppercase text-fn-text">{displayName(athlete as Athlete)}</p>
                  <p className="mt-2 text-lg font-black text-fn-green">{Number(odd).toFixed(2)}x</p>
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              step="0.01"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Stake (₦)"
              className="mt-4 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm outline-none focus:border-fn-green"
            />
            {picked && stake && (
              <p className="mt-3 text-xs uppercase tracking-widest text-fn-muted">
                Potential return <span className="text-fn-green">₦{Number(Number(stake) * pickedOdds).toLocaleString()}</span>
              </p>
            )}
            <button
              type="button"
              onClick={placeWager}
              disabled={!picked || !stake}
              className="mt-4 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60"
            >
              {saving ? 'Placing...' : 'Place Wager'}
            </button>
            {placed && (
              <p className="mt-3 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">
                Slip locked for this duel.
              </p>
            )}
          </div>
        </motion.section>
      ) : step === 'wagerLocked' && p1 && p2 ? (
        <motion.section key="wagerLocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8">
          <div className="border border-fn-gborder bg-fn-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-fn-green bg-fn-green/10">
              <Check className="h-8 w-8 text-fn-green" />
            </div>
            <p className="fn-label text-fn-green">WAGER CONFIRMED</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-widest text-fn-text">Match Ready</h2>
            <p className="mt-2 text-xs text-fn-muted">Your wager has been locked. Choose how to proceed.</p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleWatchMatch}
                className="w-full bg-fn-green px-6 py-4 text-sm font-black uppercase tracking-widest text-fn-black hover:brightness-110"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Play size={16} /> Watch Match
                </span>
              </button>
              <button
                type="button"
                onClick={handleSkipToResult}
                className="w-full border border-fn-green/40 bg-transparent px-6 py-4 text-sm font-black uppercase tracking-widest text-fn-green hover:bg-fn-green/10"
              >
                Skip to Result
              </button>
            </div>
          </div>
        </motion.section>
      ) : step === 'matchSim' && p1 && p2 ? (
        <motion.section key="matchSim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl px-4 py-6">
          <button type="button" onClick={back} className="mb-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green"><ChevronLeft size={13} /> Back</button>
          <DuelSimViewer
            playerAName={displayName(p1)}
            playerBName={displayName(p2)}
            playerAStats={getStats(p1)}
            playerBStats={getStats(p2)}
            onMatchEnd={handleMatchEnd}
            onSkipToResult={handleSkipToResult}
          />
        </motion.section>
      ) : step === 'result' && p1 && p2 && matchResult ? (
        <motion.section key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl px-4 py-6">
          <DuelResultScreen
            playerAName={displayName(p1)}
            playerBName={displayName(p2)}
            winner={matchResult.winner}
            finalKills={matchResult.kills}
            mvp={matchResult.mvp}
            stake={Number(stake)}
            odds={pickedOdds}
            pickedPlayer={picked}
            onReturnHome={handleReturnHome}
          />
        </motion.section>
      ) : null}
    </main>
  );
}
