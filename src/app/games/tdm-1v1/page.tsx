'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, Shield, Ticket, Wallet } from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { useAthletes } from '@/lib/hooks';
import { useGame } from '@/context/GameContext';
import { GAMES } from '@/lib/games';

type Athlete = {
  id: string;
  name: string;
  ign?: string | null;
  known_name?: string | null;
  team?: string | null;
  role?: string | null;
  status?: string | null;
  photo_url?: string | null;
  jersey_number?: number | string | null;
  overall_rating?: number | string | null;
  rating?: number | string | null;
  attack?: number | null;
  defense?: number | null;
  survival?: number | null;
  clutch?: number | null;
  iq?: number | null;
  game_slug?: string | null;
  is_icon?: boolean | null;
};

type Duel = { id: string; odds_a: number | string; odds_b: number | string };
type PlacedWager = { id: string; potential_payout: number | string };

const ACCENT = '#00FF41';

function displayName(athlete?: Athlete | null) {
  return athlete?.known_name || athlete?.ign || athlete?.name || 'Empty Slot';
}

function ratingOf(athlete?: Athlete | null) {
  return Number(athlete?.overall_rating ?? athlete?.rating ?? 0);
}

function photoFor(athlete?: Athlete | null) {
  return athlete?.photo_url || '';
}

function VsSlot({ athlete, side }: { athlete: Athlete | null; side: 'left' | 'right' }) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: athlete ? 1 : 0.7, scale: athlete ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={`flex min-h-[74px] items-center gap-3 rounded-sm border bg-fn-card p-2 ${side === 'right' ? 'flex-row-reverse text-right' : ''} ${athlete ? 'border-fn-green/60 shadow-[0_0_22px_rgba(0,255,65,0.14)]' : 'border-fn-gborder'}`}
    >
      <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm border border-fn-green/30 bg-fn-dark">
        {athlete?.photo_url ? (
          <img src={athlete.photo_url} alt={displayName(athlete)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-fn-muted"><Shield size={18} /></div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-fn-green">{side === 'left' ? 'Player 1' : 'Player 2'}</p>
        <p className="truncate font-display text-sm font-black uppercase text-fn-text">{displayName(athlete)}</p>
        <p className="text-[9px] uppercase tracking-widest text-fn-muted">{athlete ? `OVR ${ratingOf(athlete).toFixed(0)}` : 'Select fighter'}</p>
      </div>
    </motion.div>
  );
}

function RosterTile({ athlete, selected, index, onClick, reduceMotion }: { athlete: Athlete; selected: boolean; index: number; onClick: () => void; reduceMotion: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={reduceMotion ? undefined : { delay: Math.min(index * 0.025, 0.7), duration: 0.22 }}
      whileHover={reduceMotion ? undefined : { scale: 1.06, zIndex: 10 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={`group relative aspect-[3/4] overflow-hidden rounded-[2px] border bg-fn-dark text-left outline-none transition-all duration-200 ${selected ? 'border-[3px] border-fn-green shadow-[0_0_22px_rgba(0,255,65,0.40)]' : 'border border-fn-green/20 hover:border-fn-green hover:shadow-[0_0_18px_rgba(0,255,65,0.32)]'}`}
      aria-pressed={selected}
      aria-label={`Select ${displayName(athlete)}`}
    >
      {photoFor(athlete) ? (
        <img
          src={photoFor(athlete)}
          alt={displayName(athlete)}
          className={`h-full w-full object-cover transition-all duration-300 ${selected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0 group-focus-visible:grayscale-0'}`}
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-fn-card transition-all duration-300 ${selected ? 'text-fn-green' : 'text-fn-muted group-hover:text-fn-green'}`}>
          <Shield size={28} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-1.5 pb-1.5 pt-7">
        <p className="truncate text-[8px] font-black uppercase tracking-wider text-fn-text sm:text-[9px]">{displayName(athlete)}</p>
      </div>
      {selected && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-fn-black bg-fn-green text-fn-black shadow-[0_0_16px_rgba(0,255,65,0.8)]">
          <Check size={13} strokeWidth={4} />
        </span>
      )}
    </motion.button>
  );
}

export default function TdmOneVOnePage() {
  const reduceMotion = useReducedMotion();
  const { selectedGame, isHydrated } = useGame();
  const activeGame = selectedGame ?? GAMES[0];
  const gameSlug = activeGame.slug;
  const { data: athletes = [], loading } = useAthletes({ game_slug: isHydrated ? gameSlug : '' }) as { data: Athlete[] | null; loading: boolean };
  const roster = useMemo(() => (athletes || []).filter((athlete) => athlete.game_slug === gameSlug), [athletes, gameSlug]);
  const [playerOne, setPlayerOne] = useState<Athlete | null>(null);
  const [playerTwo, setPlayerTwo] = useState<Athlete | null>(null);
  const [duel, setDuel] = useState<Duel | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pickedPlayerId, setPickedPlayerId] = useState('');
  const [stake, setStake] = useState('');
  const [placed, setPlaced] = useState<PlacedWager | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const bothSelected = Boolean(playerOne && playerTwo);
  const oddsOne = Number(duel?.odds_a ?? 0);
  const oddsTwo = Number(duel?.odds_b ?? 0);

  function toggleAthlete(athlete: Athlete) {
    setError('');
    setPlaced(null);
    if (revealed || saving) return;
    if (playerOne?.id === athlete.id) { setPlayerOne(null); return; }
    if (playerTwo?.id === athlete.id) { setPlayerTwo(null); return; }
    if (!playerOne) { setPlayerOne(athlete); return; }
    if (!playerTwo) setPlayerTwo(athlete);
  }

  async function confirmMatchup() {
    if (!playerOne || !playerTwo) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/duels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_a_id: playerOne.id, player_b_id: playerTwo.id, game_slug: gameSlug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create duel');
      setDuel(data);
      setPickedPlayerId('');
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create duel');
    } finally {
      setSaving(false);
    }
  }

  async function placeWager() {
    if (!duel || !pickedPlayerId || !stake) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/duels/${duel.id}/wagers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picked_player_id: pickedPlayerId, stake }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Wager placement failed');
      setPlaced(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wager placement failed');
    } finally {
      setSaving(false);
    }
  }

  function resetMatchup() {
    setRevealed(false);
    setDuel(null);
    setPickedPlayerId('');
    setStake('');
    setPlaced(null);
    setError('');
  }

  async function shareSlip() {
    const picked = [playerOne, playerTwo].find((athlete) => athlete?.id === pickedPlayerId);
    const text = `Frag Naija TDM 1V1 slip: ${displayName(playerOne)} vs ${displayName(playerTwo)}. Pick ${displayName(picked)}. Stake ₦${stake}, payout ₦${Number(placed?.potential_payout || 0).toLocaleString()}`;
    if (navigator.share) await navigator.share({ text });
    else await navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-fn-black text-fn-text">
      {!revealed ? (
        <section className="mx-auto max-w-7xl px-2 py-4 sm:px-4 lg:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link href="/games" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green">
              <ChevronLeft size={13} /> Games
            </Link>
            <p className="text-[10px] font-black uppercase tracking-widest text-fn-green">{activeGame.shortName} Roster</p>
          </div>

          <div className="sticky top-14 z-20 mb-3 rounded-sm border border-fn-green/25 bg-fn-dark/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <VsSlot athlete={playerOne} side="left" />
              <motion.div
                animate={bothSelected && !reduceMotion ? { scale: [1, 1.18, 1], opacity: [0.82, 1, 0.9] } : { scale: 1, opacity: 0.82 }}
                transition={{ duration: 0.7 }}
                className={`font-display text-xl font-black ${bothSelected ? 'text-fn-green drop-shadow-[0_0_12px_rgba(0,255,65,0.9)]' : 'text-fn-muted'}`}
              >
                VS
              </motion.div>
              <VsSlot athlete={playerTwo} side="right" />
            </div>
          </div>

          <div className="mb-3 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-widest sm:text-4xl">TDM 1V1 Character Select</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-fn-muted">Pick two different athletes. Tap a selected portrait again to deselect.</p>
          </div>

          {error && <p className="mb-3 rounded-sm border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}

          <div className="grid grid-cols-4 gap-1 bg-fn-dark p-1 sm:gap-1.5 md:grid-cols-6 xl:grid-cols-8">
            {loading && Array.from({ length: 24 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-[2px] bg-fn-card" />)}
            {!loading && roster.map((athlete, index) => (
              <RosterTile
                key={athlete.id}
                athlete={athlete}
                index={index}
                selected={playerOne?.id === athlete.id || playerTwo?.id === athlete.id}
                reduceMotion={Boolean(reduceMotion)}
                onClick={() => toggleAthlete(athlete)}
              />
            ))}
          </div>

          {!loading && roster.length === 0 && (
            <div className="rounded-sm border border-fn-gborder bg-fn-card p-6 text-center text-sm text-fn-muted">
              No athletes found for {activeGame.name}. Switch games or add athletes for this title.
            </div>
          )}

          {bothSelected && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky bottom-4 z-20 mt-4 flex justify-center"
            >
              <button
                type="button"
                onClick={confirmMatchup}
                disabled={saving}
                className="fn-btn px-8 py-3 text-[11px] shadow-[0_0_28px_rgba(0,255,65,0.28)] disabled:opacity-60"
              >
                {saving ? 'LOCKING MATCHUP...' : 'CONFIRM MATCHUP'}
              </button>
            </motion.div>
          )}
        </section>
      ) : (
        <motion.section
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10"
        >
          {!reduceMotion && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0] }} transition={{ duration: 0.55 }} className="pointer-events-none absolute inset-0 z-10 bg-fn-green/25" />}
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button onClick={resetMatchup} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:text-fn-green">
                <ChevronLeft size={13} /> Change Fighters
              </button>
              <p className="fn-label text-fn-green">Odds Locked • {activeGame.shortName}</p>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-[1fr_auto_1fr]">
              {[playerOne, playerTwo].map((athlete, index) => {
                const odds = index === 0 ? oddsOne : oddsTwo;
                const isPicked = pickedPlayerId === athlete?.id;
                return (
                  <motion.div
                    key={athlete?.id || index}
                    initial={reduceMotion ? false : { opacity: 0, x: index === 0 ? -140 : 140, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18, delay: index * 0.08 }}
                    className="space-y-3"
                  >
                    {athlete && (
                      <PlayerCardTemplate
                        athlete={{ ...athlete, ign: athlete.ign || athlete.name }}
                        rating={ratingOf(athlete)}
                        primary={ACCENT}
                        gameName={activeGame.name}
                        variant="featured"
                        imageLoading="eager"
                        imageFetchPriority="high"
                        className="mx-auto max-w-sm"
                      />
                    )}
                    <button
                      onClick={() => athlete && setPickedPlayerId(athlete.id)}
                      className={`w-full rounded-sm border px-4 py-3 text-center transition-all ${isPicked ? 'border-fn-green bg-fn-green/15 shadow-[0_0_24px_rgba(0,255,65,0.28)]' : 'border-fn-gborder bg-fn-card hover:border-fn-green/50'}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-fn-muted">Pick Winner</p>
                      <p className="font-display text-xl font-black uppercase text-fn-text">{displayName(athlete)}</p>
                      <p className="text-2xl font-black text-fn-green">{odds.toFixed(2)}x</p>
                    </button>
                  </motion.div>
                );
              })}

              <div className="flex h-full min-h-[120px] items-center justify-center">
                <div className="rounded-full border border-fn-green/40 bg-fn-green/10 px-6 py-4 font-display text-4xl font-black text-fn-green shadow-[0_0_36px_rgba(0,255,65,0.22)]">VS</div>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-xl rounded-sm border border-fn-gborder bg-fn-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet size={15} className="text-fn-green" />
                <h2 className="text-sm font-black uppercase tracking-widest">Place TDM 1V1 Wager</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={stake}
                  onChange={(event) => setStake(event.target.value)}
                  placeholder="Stake (₦)"
                  className="flex-1 rounded-sm border border-fn-gborder bg-fn-dark px-3 py-3 text-sm outline-none focus:border-fn-green"
                />
                <button onClick={placeWager} disabled={!pickedPlayerId || !stake || saving || Boolean(placed)} className="fn-btn px-5 py-3 text-[10px] disabled:opacity-60">
                  {saving ? 'PLACING...' : 'PLACE WAGER'}
                </button>
              </div>
              {error && <p className="mt-3 rounded-sm border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
              {placed && (
                <div className="mt-4 rounded-sm border border-fn-green/30 bg-fn-green/10 p-3">
                  <p className="font-bold text-fn-green">Wager placed. Potential payout ₦{Number(placed.potential_payout).toLocaleString()}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => window.print()} className="rounded-sm border border-fn-gborder px-3 py-2 text-xs text-fn-text hover:border-fn-green"><Ticket size={14} className="inline" /> Print Slip</button>
                    <button onClick={shareSlip} className="rounded-sm border border-fn-gborder px-3 py-2 text-xs text-fn-text hover:border-fn-green">Share Slip</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </main>
  );
}
