'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, Shield, X } from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { useAthletes } from '@/lib/hooks';
import { useGame } from '@/context/GameContext';
import { GAMES } from '@/lib/games';
import { calculateDuelOddsFromKd, kdOf } from '@/lib/duel-odds';

type Athlete = { id:string; name:string; ign?:string|null; known_name?:string|null; team?:string|null; role?:string|null; status?:string|null; photo_url?:string|null; jersey_number?:number|string|null; overall_rating?:number|string|null; rating?:number|string|null; kills?:number|string|null; attack?:number|null; defense?:number|null; survival?:number|null; clutch?:number|null; iq?:number|null; game_slug?:string|null; is_icon?:boolean|null };
type Duel = { id:string; odds_a:number|string; odds_b:number|string };
type PlacedWager = { id:string; potential_payout:number|string; stake?:number|string };

const SIGNAL = '#4dff6e';
const EMBER = '#ff5a3c';

function displayName(athlete?: Athlete | null) { return athlete?.known_name || athlete?.ign || athlete?.name || 'Empty Slot'; }
function ratingOf(athlete?: Athlete | null) { return Number(athlete?.overall_rating ?? athlete?.rating ?? 0); }
function portrait(athlete?: Athlete | null) { return athlete?.photo_url || ''; }

function Slot({ athlete, label }: { athlete: Athlete | null; label: string }) {
  return (
    <div className={`min-h-[58px] border border-dashed p-2 ${athlete ? 'border-solid border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-card'}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fn-muted">{label}</p>
      {athlete ? <p className="mt-1 truncate bg-fn-green px-2 py-1 text-xs font-black uppercase text-fn-black">{displayName(athlete)}</p> : <p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">Awaiting pick</p>}
    </div>
  );
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
  const [p1, setP1] = useState<Athlete | null>(null); const [p2, setP2] = useState<Athlete | null>(null); const [duel, setDuel] = useState<Duel | null>(null); const [reveal, setReveal] = useState(false); const [picked, setPicked] = useState(''); const [stake, setStake] = useState(''); const [placed, setPlaced] = useState<PlacedWager | null>(null); const [modal, setModal] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const previewOdds = p1 && p2 ? calculateDuelOddsFromKd(kdOf(p1), kdOf(p2)) : { odds_a: 0, odds_b: 0 };
  const oddsA = Number(duel?.odds_a ?? previewOdds.odds_a); const oddsB = Number(duel?.odds_b ?? previewOdds.odds_b);
  const both = Boolean(p1 && p2);

  function toggle(a: Athlete) { setError(''); if (reveal || saving) return; if (p1?.id === a.id) setP1(null); else if (p2?.id === a.id) setP2(null); else if (!p1) setP1(a); else if (!p2) setP2(a); }
  async function confirm() { if (!p1 || !p2) return; setSaving(true); setError(''); try { const res = await fetch('/api/duels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_a_id: p1.id, player_b_id: p2.id, game_slug: gameSlug }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not create duel'); setDuel(data); setPicked(''); setReveal(true); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create duel'); } finally { setSaving(false); } }
  function backToGrid() { setReveal(false); setDuel(null); setPicked(''); setStake(''); setPlaced(null); setModal(false); setError(''); }
  function fullReset() { setP1(null); setP2(null); backToGrid(); }
  async function placeWager() { if (!duel || !picked || !stake) return; setSaving(true); setError(''); try { const res = await fetch(`/api/duels/${duel.id}/wagers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ picked_player_id: picked, stake }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Wager placement failed'); setPlaced(data); } catch (e) { setError(e instanceof Error ? e.message : 'Wager placement failed'); } finally { setSaving(false); } }
  const pickedAthlete = [p1, p2].find((a) => a?.id === picked); const pickedOdds = picked === p1?.id ? oddsA : picked === p2?.id ? oddsB : 0;

  return <main className="min-h-screen bg-fn-black text-fn-text">
    {!reveal ? <section className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6">
      <Link href="/games" className="mb-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-fn-green"><ChevronLeft size={13}/> Games</Link>
      <div className="mb-3"><p className="fn-label">TDM 1V1</p><h1 className="text-2xl font-black uppercase tracking-widest sm:text-4xl">Select Combatants</h1></div>
      <div className="sticky top-14 z-20 mb-3 border border-fn-gborder bg-fn-card/95 p-2 backdrop-blur">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Slot athlete={p1} label="P1"/><div className={`text-sm font-black ${both ? 'text-fn-green drop-shadow-[0_0_10px_rgb(77_255_110)]' : 'text-fn-muted'}`}>VS</div><Slot athlete={p2} label="P2"/></div>
        <AnimatePresence>{both && <motion.button initial={reduceMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} type="button" onClick={confirm} disabled={saving} className="mt-2 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green disabled:opacity-60">{saving ? 'Confirming...' : 'Confirm Matchup'}</motion.button>}</AnimatePresence>
      </div>
      {error && <p className="mb-3 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
      <div className="grid grid-cols-4 gap-[6px] md:grid-cols-6 xl:grid-cols-8">
        {loading && Array.from({ length: 24 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse border border-fn-gborder bg-fn-card"/>)}
        {!loading && roster.map((a, i) => <RosterTile key={a.id} athlete={a} index={i} selected={p1?.id === a.id || p2?.id === a.id} reduceMotion={reduceMotion} onClick={() => toggle(a)}/>)}
      </div>
    </section> : p1 && p2 && <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_center,#0f1710_0%,#050704_72%)] px-4 py-6">
      {!reduceMotion && <><motion.div className="pointer-events-none absolute inset-0 z-20 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: .5, times: [0, .35, .65, 1] }}/><motion.div className="absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent,#4dff6e22,transparent,#4dff6e18,transparent)]" initial={{ scale: .6, rotate: 0 }} animate={{ scale: 1, rotate: 20 }} transition={{ duration: 1.4 }}/></>}
      <div className="absolute -left-20 top-1/4 h-1 w-[70vw] rotate-[-18deg] bg-fn-green/20 blur-sm"/><div className="absolute -right-20 bottom-1/4 h-1 w-[70vw] rotate-[-18deg] bg-fn-green/20 blur-sm"/>
      <button type="button" onClick={backToGrid} className="relative z-30 mb-8 text-xs font-black uppercase tracking-widest text-fn-text hover:text-fn-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-fn-green">← Back</button>
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <RevealFighter athlete={p1} odds={oddsA} side="left" reduceMotion={reduceMotion} picked={picked === p1.id} onPick={() => setPicked(p1.id)}/>
        <motion.div initial={reduceMotion ? false : { scale: .3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: .3, duration: .3 }} className="text-center text-[42px] font-black text-fn-green drop-shadow-[0_0_18px_rgb(77_255_110)] motion-safe:animate-pulse">VS</motion.div>
        <RevealFighter athlete={p2} odds={oddsB} side="right" reduceMotion={reduceMotion} picked={picked === p2.id} onPick={() => setPicked(p2.id)}/>
      </div>
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="relative z-10 mx-auto mt-8 max-w-md"><button type="button" onClick={() => setModal(true)} disabled={!picked} style={{ backgroundColor: EMBER }} className="w-full px-4 py-4 text-sm font-black uppercase tracking-widest text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green disabled:opacity-50">Confirm & Place Wager</button></motion.div>
    </section>}
    {modal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md border border-fn-gborder bg-fn-card p-5"><button type="button" onClick={() => setModal(false)} className="float-right text-fn-muted hover:text-fn-text"><X size={16}/></button>{placed ? <div><p className="fn-label">Wager Confirmed</p><h2 className="mt-1 text-xl font-black uppercase tracking-widest text-fn-green">Slip Locked</h2><p className="mt-4 text-sm text-fn-muted">Stake ₦{Number(stake).toLocaleString()} · Potential return ₦{Number(placed.potential_payout || Number(stake) * pickedOdds).toLocaleString()}</p><button type="button" onClick={fullReset} className="mt-5 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Done</button></div> : <div><p className="fn-label">{displayName(p1)} vs {displayName(p2)}</p><h2 className="mt-1 text-xl font-black uppercase tracking-widest">Wager Slip</h2><p className="mt-3 text-xs uppercase tracking-widest text-fn-muted">Backing <span className="text-fn-green">{displayName(pickedAthlete)}</span> @ {pickedOdds.toFixed(2)}x</p><input type="number" min="1" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Stake (₦)" className="mt-4 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm outline-none focus:border-fn-green"/>{error && <p className="mt-3 text-xs text-fn-red">{error}</p>}<button type="button" onClick={placeWager} disabled={!stake || saving} className="mt-4 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60">{saving ? 'Placing...' : 'Place Wager'}</button><button type="button" onClick={() => setModal(false)} className="mt-3 w-full text-xs font-bold uppercase tracking-widest text-fn-muted hover:text-fn-text">Cancel</button></div>}</div></div>}
  </main>;
}
