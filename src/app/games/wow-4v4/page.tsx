'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import RouteLoadingScreen from '@/components/common/RouteLoadingScreen';
import { Check, ChevronLeft, Shield, X, Play } from 'lucide-react';
import { MatchSimViewer, type PlayerDot } from '@/components/common/MatchSimViewer';
import { MatchResultScreen } from '@/components/common/MatchResultScreen';
import OptimizedImage from '@/components/common/OptimizedImage';

const PUBG_SLUG = 'pubg-mobile';

type Athlete = { id:string; name:string; ign?:string|null; known_name?:string|null; team?:string|null; role?:string|null; photo_url?:string|null; attack?:number|null; defense?:number|null; iq?:number|null; overall_rating?:number|string|null; rating?:number|string|null };
type Team = { id:string; name:string; logo_url?:string|null; region?:string|null; rank?:number|null; strength?:number|null; wins?:number|null; losses?:number|null; kills?:number|null; power_rank?:number|null; total_ranking_points?:number|null; players?:Athlete[] };
type EffectiveStats = { attack:number; defense:number; iq:number; power:number };

type Step = 'grid' | 'reveal' | 'roster' | 'cube' | 'wager' | 'wagerLocked' | 'matchSim' | 'result';

function displayName(athlete?: Athlete | null) { return athlete?.known_name || athlete?.ign || athlete?.name || 'Unknown'; }
function logo(team?: Team | null) { return team?.logo_url || ''; }
function rankOf(team?: Team | null, index = 0) { return team?.power_rank ?? team?.rank ?? index + 1; }
function statValue(value: unknown, fallback = 75) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.max(1, Math.min(100, n)) : fallback; }
function round(value: number) { return Math.round(value * 100) / 100; }

function teamBaseStats(team?: Team | null): EffectiveStats {
  const players = team?.players ?? [];
  const withStats = players.filter((p) => p.attack || p.defense || p.iq);
  if (withStats.length) return aggregateAthleteStats(withStats);
  const strength = statValue(team?.strength, 78);
  const winLift = Number(team?.wins ?? 0) - Number(team?.losses ?? 0);
  const attack = statValue(strength + Math.min(8, Number(team?.kills ?? 0) / 80), strength);
  const defense = statValue(strength + Math.min(6, winLift / 3), strength);
  const iq = statValue(strength + Math.min(5, Number(team?.total_ranking_points ?? 0) / 100), strength);
  return { attack, defense, iq, power: round((attack + defense + iq) / 3) };
}

function aggregateAthleteStats(players: Athlete[]): EffectiveStats {
  const source = players.length ? players : [];
  const total = source.reduce((acc, player) => {
    const rating = statValue(player.overall_rating ?? player.rating, 75);
    acc.attack += statValue(player.attack, rating);
    acc.defense += statValue(player.defense, rating);
    acc.iq += statValue(player.iq, rating);
    return acc;
  }, { attack: 0, defense: 0, iq: 0 });
  const count = Math.max(1, source.length);
  const attack = round(total.attack / count);
  const defense = round(total.defense / count);
  const iq = round(total.iq / count);
  return { attack, defense, iq, power: round((attack * 0.38) + (defense * 0.32) + (iq * 0.30)) };
}

function calculateTeamOdds(a: EffectiveStats, b: EffectiveStats) {
  const safeA = Math.max(1, a.power);
  const safeB = Math.max(1, b.power);
  const total = safeA + safeB;
  return { odds_a: round(total / safeA), odds_b: round(total / safeB) };
}

function preloadImages(urls: string[]) {
  if (typeof window === 'undefined') return Promise.resolve();
  return Promise.allSettled(urls.filter(Boolean).map((src) => new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => ('decode' in image ? image.decode().then(resolve).catch(resolve) : resolve());
    image.onerror = () => resolve();
    image.src = src;
  }))).then(() => undefined);
}

function Slot({ team, label }: { team: Team | null; label: string }) {
  return <div className={`min-h-[58px] border border-dashed p-2 ${team ? 'border-solid border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-card'}`}><p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fn-muted">{label}</p>{team ? <p className="mt-1 truncate bg-fn-green px-2 py-1 text-xs font-black uppercase text-fn-black">{team.name}</p> : <p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">Awaiting pick</p>}</div>;
}

function TeamTile({ team, rank, selected, index, reduceMotion, onClick }: { team: Team; rank: number; selected: boolean; index: number; reduceMotion: boolean; onClick: () => void }) {
  return <motion.button type="button" onClick={onClick} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: index * 0.035, duration: 0.26 }} whileHover={reduceMotion ? undefined : { scale: 1.035 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} aria-pressed={selected} className={`group relative min-h-[112px] overflow-hidden border bg-fn-card p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green ${selected ? 'border-fn-green' : 'border-fn-gborder hover:border-fn-green'}`}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,255,110,.12),transparent_55%)] opacity-0 transition-opacity group-hover:opacity-100" />
    <div className={`relative flex items-center gap-3 transition duration-300 ${selected ? 'grayscale-0 brightness-100' : 'grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100'}`}>
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden border border-fn-gborder bg-fn-dark">{logo(team) ? <OptimizedImage src={logo(team)} alt={team.name} className="h-full w-full object-cover" /> : <Shield className="text-fn-green" />}</span>
      <span className="min-w-0"><span className="block text-[11px] font-black uppercase tracking-widest text-fn-text">#{rank} {team.name}</span><span className="mt-2 inline-flex border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-fn-green">{Number(team.total_ranking_points ?? 0).toFixed(0)} PTS</span></span>
    </div>
    {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center border border-fn-black bg-fn-green text-fn-black"><Check size={13} strokeWidth={4} /></span>}
  </motion.button>;
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return <div className="border border-fn-gborder bg-fn-card/80 p-3"><p className="fn-label">{label}</p><p className="mt-1 font-display text-2xl font-black text-fn-text">{Math.round(value)}</p><div className="mt-2 h-1 bg-fn-dark"><span className="block h-full bg-fn-green" style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}

function RevealTeam({ team, side, stats, rank, reduceMotion }: { team: Team; side: 'left' | 'right'; stats: EffectiveStats; rank: number; reduceMotion: boolean }) {
  return <motion.div initial={reduceMotion ? false : { x: side === 'left' ? '-120%' : '120%', filter: 'blur(14px)', opacity: 0 }} animate={{ x: 0, filter: 'blur(0px)', opacity: 1 }} transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.2, 1.4, 0.4, 1] }} className="flex flex-col items-center gap-4">
    <div className="flex h-36 w-36 items-center justify-center overflow-hidden border border-fn-gborder bg-fn-card">{logo(team) ? <OptimizedImage src={logo(team)} alt={team.name} className="h-full w-full object-cover brightness-90" /> : <Shield size={52} className="text-fn-green" />}</div>
    <div className="text-center"><p className="fn-label text-fn-green">POWER RANK #{rank}</p><h2 className="mt-1 text-2xl font-black uppercase tracking-widest text-fn-text">{team.name}</h2></div>
    <div className="grid w-full max-w-sm grid-cols-3 gap-2"><StatBlock label="Attack" value={stats.attack} /><StatBlock label="Defense" value={stats.defense} /><StatBlock label="Battle IQ" value={stats.iq} /></div>
  </motion.div>;
}

function AthleteTile({ athlete, selected, disabled, index, reduceMotion, onClick }: { athlete: Athlete; selected: boolean; disabled: boolean; index: number; reduceMotion: boolean; onClick: () => void }) {
  return <motion.button type="button" onClick={onClick} disabled={disabled && !selected} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={reduceMotion ? undefined : { delay: index * 0.018, duration: 0.24 }} aria-pressed={selected} className={`group relative aspect-[3/4] overflow-hidden border bg-fn-card text-left disabled:opacity-45 ${selected ? 'border-fn-green' : 'border-fn-gborder hover:border-fn-green'}`}>
    {athlete.photo_url ? <OptimizedImage src={athlete.photo_url} alt={displayName(athlete)} className={`h-full w-full object-cover transition duration-300 ${selected ? 'grayscale-0 brightness-[.8]' : 'grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-[.8]'}`} /> : <div className="flex h-full w-full items-center justify-center text-fn-muted"><Shield /></div>}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-1.5 pb-1.5 pt-[48%]"><p className="truncate text-[8px] font-black uppercase tracking-wider text-fn-text sm:text-[9px]">{displayName(athlete)}</p></div>
    {selected && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-fn-black bg-fn-green text-fn-black"><Check size={13} strokeWidth={4} /></span>}
  </motion.button>;
}

export default function WowFourVFourPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>('grid');
  const [a, setA] = useState<Team | null>(null);
  const [b, setB] = useState<Team | null>(null);
  const [rosterA, setRosterA] = useState<string[]>([]);
  const [rosterB, setRosterB] = useState<string[]>([]);
  const [picked, setPicked] = useState<'a' | 'b' | ''>('');
  const [stake, setStake] = useState('');
  const [placed, setPlaced] = useState(false);
  const [matchResult, setMatchResult] = useState<{ winner: 'a' | 'b'; score: { a: number; b: number }; mvp?: PlayerDot } | null>(null);

  useEffect(() => { fetch(`/api/teams?game_slug=${PUBG_SLUG}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : []).then((data) => setTeams(Array.isArray(data) ? data : [])).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    let cancelled = false; setReady(false);
    if (loading) return () => { cancelled = true; };
    const urls = teams.flatMap((team) => [logo(team), ...(team.players ?? []).map((p) => p.photo_url || '')]);
    Promise.all([preloadImages(urls), new Promise((resolve) => window.setTimeout(resolve, 700))]).then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [loading, teams]);

  const statsA = useMemo(() => rosterA.length === 4 && a ? aggregateAthleteStats((a.players ?? []).filter((p) => rosterA.includes(p.id))) : teamBaseStats(a), [a, rosterA]);
  const statsB = useMemo(() => rosterB.length === 4 && b ? aggregateAthleteStats((b.players ?? []).filter((p) => rosterB.includes(p.id))) : teamBaseStats(b), [b, rosterB]);
  const odds = calculateTeamOdds(statsA, statsB);
  const pickedOdds = picked === 'a' ? odds.odds_a : picked === 'b' ? odds.odds_b : 0;
  const canConfirmRoster = rosterA.length === 4 && rosterB.length === 4;

  function resetToGrid() { setStep('grid'); setA(null); setB(null); setRosterA([]); setRosterB([]); setPicked(''); setStake(''); setPlaced(false); setMatchResult(null); }
  function back() { 
    if (step === 'grid') return; 
    if (step === 'reveal') setStep('grid'); 
    else if (step === 'roster') setStep('reveal'); 
    else if (step === 'wager') setStep('roster');
    else if (step === 'wagerLocked') setStep('wager');
    else if (step === 'matchSim' || step === 'result') setStep('wagerLocked');
    else setStep('roster'); 
  }
  function toggleTeam(team: Team) { if (a?.id === team.id) setA(null); else if (b?.id === team.id) setB(null); else if (!a) setA(team); else if (!b) setB(team); }
  function toggleRoster(side: 'a' | 'b', id: string) { const setter = side === 'a' ? setRosterA : setRosterB; const current = side === 'a' ? rosterA : rosterB; setter(current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current); }
  function startCube() { setStep('cube'); window.setTimeout(() => setStep('wager'), 1250); }
  function placeWager() { setPlaced(true); setStep('wagerLocked'); }
  function handleWatchMatch() { setStep('matchSim'); }
  function handleSkipToResult() { 
    // Generate result directly without watching
    const winner = Math.random() > 0.5 ? 'a' : 'b';
    const winningKills = 16 + Math.floor(Math.random() * 8);
    const losingKills = 8 + Math.floor(Math.random() * (winningKills - 10));
    const finalScore = winner === 'a' ? { a: winningKills, b: losingKills } : { a: losingKills, b: winningKills };
    setMatchResult({ winner, score: finalScore });
    setStep('result');
  }
  function handleMatchEnd(result: { winner: 'a' | 'b'; score: { a: number; b: number }; mvp?: PlayerDot }) {
    setMatchResult(result);
    setStep('result');
  }
  function handleReturnHome() { resetToGrid(); }

  // Get roster player data for match sim
  const teamARosterData = useMemo(() => {
    if (!a) return [];
    return (a.players ?? []).filter(p => rosterA.includes(p.id)).map(p => ({ id: p.id, name: displayName(p) }));
  }, [a, rosterA]);
  
  const teamBRosterData = useMemo(() => {
    if (!b) return [];
    return (b.players ?? []).filter(p => rosterB.includes(p.id)).map(p => ({ id: p.id, name: displayName(p) }));
  }, [b, rosterB]);

  return <main className="min-h-screen bg-fn-black text-fn-text"><AnimatePresence mode="wait">{!ready ? <RouteLoadingScreen subtitle="LOADING MATCHUP" ariaLabel="Loading WOW Mode 4V4 matchup" reduceMotion={reduceMotion} loaderKey="wow-loader" /> : step === 'grid' ? <motion.section key="grid" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6">
    <Link href="/games" className="mb-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green"><ChevronLeft size={13} /> Virtual Games</Link>
    <div className="mb-3"><p className="fn-label">WOW MODE 4V4</p><h1 className="text-2xl font-black uppercase tracking-widest sm:text-4xl">Select Teams</h1></div>
    <div className="sticky top-14 z-20 mb-3 border border-fn-gborder bg-fn-card/95 p-2 backdrop-blur"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Slot team={a} label="Team A" /><div className={`text-sm font-black ${a && b ? 'text-fn-green drop-shadow-[0_0_10px_rgb(77_255_110)]' : 'text-fn-muted'}`}>VS</div><Slot team={b} label="Team B" /></div>{a && b && <button type="button" onClick={() => setStep('reveal')} className="mt-2 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Confirm Matchup</button>}</div>
    <div className="grid gap-[6px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{teams.map((team, i) => <TeamTile key={team.id} team={team} rank={rankOf(team, i)} selected={a?.id === team.id || b?.id === team.id} index={i} reduceMotion={reduceMotion} onClick={() => toggleTeam(team)} />)}</div>
  </motion.section> : step === 'reveal' && a && b ? <motion.section key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_center,#0f1710_0%,#050704_72%)] px-4 py-6">
    {!reduceMotion && <><motion.div className="pointer-events-none absolute inset-0 z-20 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 0.5, times: [0, .35, .65, 1] }} /><motion.div className="absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent,#4dff6e22,transparent,#4dff6e18,transparent)]" initial={{ scale: .6, rotate: 0 }} animate={{ scale: 1, rotate: 20 }} transition={{ duration: 1.4 }} /></>}
    <button type="button" onClick={back} className="relative z-30 mb-8 text-xs font-black uppercase tracking-widest text-fn-text hover:text-fn-green">← Back</button><div className="relative z-10 mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[1fr_auto_1fr]"><RevealTeam team={a} side="left" stats={statsA} rank={rankOf(a)} reduceMotion={reduceMotion} /><motion.div initial={reduceMotion ? false : { scale: .3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: .3, duration: .3 }} className="text-center text-[42px] font-black text-fn-green drop-shadow-[0_0_18px_rgb(77_255_110)]">VS</motion.div><RevealTeam team={b} side="right" stats={statsB} rank={rankOf(b)} reduceMotion={reduceMotion} /></div><div className="relative z-10 mx-auto mt-8 max-w-md"><button type="button" onClick={() => setStep('roster')} className="w-full bg-fn-green px-4 py-4 text-sm font-black uppercase tracking-widest text-fn-black">Lock Teams & Select Roster</button></div>
  </motion.section> : step === 'roster' && a && b ? <motion.section key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6"><button type="button" onClick={back} className="mb-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green"><ChevronLeft size={13} /> Back</button><div className="mb-4"><p className="fn-label">WOW MODE 4V4</p><h1 className="text-2xl font-black uppercase tracking-widest sm:text-4xl">Select Roster</h1><p className="mt-2 text-xs text-fn-muted">Roster picks affect the effective Attack, Defense, Battle IQ, and wager odds for this matchup.</p></div>{[[a, rosterA, 'a'], [b, rosterB, 'b']].map(([team, roster, side]) => <section key={(team as Team).id} className="mb-8 border border-fn-gborder bg-fn-card p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-widest text-fn-text">{(team as Team).name}</h2><span className="border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-fn-green">{(roster as string[]).length}/4 Selected</span></div><div className="grid grid-cols-4 gap-[6px] md:grid-cols-6 xl:grid-cols-8">{((team as Team).players ?? []).map((player, i) => <AthleteTile key={player.id} athlete={player} index={i} selected={(roster as string[]).includes(player.id)} disabled={(roster as string[]).length >= 4} reduceMotion={reduceMotion} onClick={() => toggleRoster(side as 'a'|'b', player.id)} />)}</div></section>)}<button type="button" onClick={startCube} disabled={!canConfirmRoster} className="sticky bottom-4 w-full bg-fn-green px-4 py-4 text-sm font-black uppercase tracking-widest text-fn-black disabled:opacity-50">Confirm Roster</button></motion.section> : step === 'cube' && a && b ? <motion.section key="cube" className="flex min-h-screen items-center justify-center overflow-hidden bg-[#080a07] px-4" style={{ perspective: 900 }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,255,110,.16),transparent_58%)]" /><motion.div className="relative h-44 w-44 [transform-style:preserve-3d]" initial={{ rotateX: 0, rotateY: 0, scale: .82 }} animate={{ rotateX: [0, 18, 360], rotateY: [0, 160, 720], scale: [.82, 1.08, .92] }} transition={{ duration: 1.15, ease: [0.2, 1, 0.3, 1] }}>{[a,b,a,b].map((team, i) => <div key={i} className="absolute inset-0 flex flex-col items-center justify-center border border-fn-green/50 bg-fn-card/95 shadow-[0_0_35px_rgba(77,255,110,.28)]" style={{ transform: i === 0 ? 'translateZ(88px)' : i === 1 ? 'rotateY(180deg) translateZ(88px)' : i === 2 ? 'rotateY(90deg) translateZ(88px)' : 'rotateY(-90deg) translateZ(88px)' }}>{logo(team) ? <OptimizedImage src={logo(team)} alt="" className="h-16 w-16 object-cover" /> : <Shield className="text-fn-green" />}<p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-fn-text">{team.name}</p></div>)}</motion.div></motion.section> : step === 'wager' && a && b ? <motion.section key="wager" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8"><button type="button" onClick={back} className="mb-6 text-left text-xs font-black uppercase tracking-widest text-fn-text hover:text-fn-green">← Back</button><div className="border border-fn-gborder bg-fn-card p-5"><p className="fn-label">WOW MODE 4V4</p><h1 className="mt-1 text-xl font-black uppercase tracking-widest">{a.name} vs {b.name}</h1><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['a', a, odds.odds_a], ['b', b, odds.odds_b]].map(([side, team, odd]) => <button key={side as string} type="button" onClick={() => setPicked(side as 'a'|'b')} className={`border p-3 text-left ${picked === side ? 'border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-dark'}`}><p className="text-xs font-black uppercase text-fn-text">{(team as Team).name}</p><p className="mt-2 text-lg font-black text-fn-green">{Number(odd).toFixed(2)}x</p></button>)}</div><input type="number" min="1" step="0.01" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Stake (₦)" className="mt-4 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm outline-none focus:border-fn-green" />{picked && stake && <p className="mt-3 text-xs uppercase tracking-widest text-fn-muted">Potential return <span className="text-fn-green">₦{Number(Number(stake) * pickedOdds).toLocaleString()}</span></p>}<button type="button" onClick={placeWager} disabled={!picked || !stake} className="mt-4 w-full bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60">{placed ? 'Wager Locked' : 'Place Wager'}</button>{placed && <p className="mt-3 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">Slip locked for this WOW Mode matchup.</p>}</div></motion.section> : step === 'wagerLocked' && a && b ? <motion.section key="wagerLocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-8">
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
  </motion.section> : step === 'matchSim' && a && b ? <motion.section key="matchSim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl px-4 py-6">
    <button type="button" onClick={back} className="mb-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green"><ChevronLeft size={13} /> Back</button>
    <MatchSimViewer
      teamAName={a.name}
      teamBName={b.name}
      teamARoster={teamARosterData}
      teamBRoster={teamBRosterData}
      onMatchEnd={handleMatchEnd}
      onSkipToResult={handleSkipToResult}
    />
  </motion.section> : step === 'result' && a && b && matchResult ? <motion.section key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl px-4 py-6">
    <MatchResultScreen
      teamAName={a.name}
      teamBName={b.name}
      winner={matchResult.winner}
      finalScore={matchResult.score}
      mvp={matchResult.mvp}
      stake={Number(stake)}
      odds={pickedOdds}
      pickedTeam={picked}
      onReturnHome={handleReturnHome}
    />
  </motion.section> : null}</AnimatePresence>{step !== 'grid' && <button type="button" onClick={resetToGrid} className="fixed right-4 top-16 z-50 border border-fn-gborder bg-fn-card px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green"><X size={12} className="inline" /> Reset</button>}</main>;
}
