'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Lock,
} from 'lucide-react';
import { GAMES, type Game, type GameMode } from '@/lib/games';
import { useGame } from '@/context/GameContext';


function ModeCard({ mode, game }: { mode: GameMode; game: Game }) {
  const ready = mode.status === 'live' && Boolean(mode.route);
  const className = `flex items-center justify-between rounded-sm border p-4 text-left text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green ${ready ? 'bg-fn-green/10 text-fn-text hover:bg-fn-green/20' : 'border-fn-gborder bg-fn-dark text-fn-muted opacity-60'}`;
  const style = ready ? { borderColor: game.colors.primary } : undefined;
  const content = <><span><span className="block">{mode.label}</span><span className="mt-1 block text-[9px] text-fn-muted">{ready ? `${mode.variant ?? 'Mode'} · Live now` : `${mode.variant ?? 'Mode'} · TBD / Coming Soon`}</span></span>{ready ? <ChevronRight size={14} style={{ color: game.colors.primary }} /> : <Lock size={14} className="text-fn-muted" />}</>;

  return ready ? <Link href={mode.route!} className={className} style={style} aria-label={`Open ${mode.label} mode`}>{content}</Link> : <button type="button" disabled className={className}>{content}</button>;
}

function VirtualGamesAccordion({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 border border-fn-gborder bg-fn-card/80">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={`${game.slug}-virtual-games-panel`}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-fn-green/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green"
      >
        <span>
          <span className="fn-label" style={{ color: game.colors.primary }}>Choose Mode</span>
          <span className="mt-1 block text-sm font-black uppercase tracking-widest text-fn-text">Virtual Games</span>
          <span className="mt-1 block text-[10px] uppercase tracking-widest text-fn-muted">{game.modes.length} scoped modes · collapsed by default</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center border border-fn-gborder bg-fn-black text-fn-green transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={16} />
        </span>
      </button>
      {open && (
        <div id={`${game.slug}-virtual-games-panel`} className="grid gap-3 border-t border-fn-gborder p-3 sm:grid-cols-2 lg:grid-cols-3">
          {game.modes.map((mode) => <ModeCard key={mode.key} mode={mode} game={game} />)}
        </div>
      )}
    </div>
  );
}

function GenericHub({ game }: { game: Game }) {
  const links = [
    ['Athletes', '/athletes'], ['Teams', '/teams'], ['Tournaments', '/tournaments'],
    ['Communities', '/communities'], ['Wager', '/wager'], ['Shop', '/shop'], ['Transfers', '/transfer-window'],
  ];

  return (
    <main className="min-h-screen px-4 py-16 sm:px-8 lg:px-12">
      <section
        className="rounded-sm border border-fn-gborder bg-fn-card p-8"
        style={{ background: `linear-gradient(135deg, ${game.colors.primary}10, rgb(var(--fn-black)) 70%)` }}
      >
        <p className="fn-label mb-3 flex items-center gap-2"><Gamepad2 size={12} style={{ color: game.colors.primary }} /> GAME SPACE</p>
        <h1 className="font-display text-5xl font-black uppercase text-fn-text">{game.name}</h1>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-fn-muted">
          You are now browsing the {game.name} space. The sections below use the selected game context and only show records tagged with <span style={{ color: game.colors.primary }}>{game.slug}</span>.
        </p>
        {game.hasModeMenu && <VirtualGamesAccordion game={game} />}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark p-4 text-xs font-bold uppercase tracking-widest text-fn-text hover:border-fn-green/40">
              <span>{label}</span>
              <ChevronRight size={14} style={{ color: game.colors.primary }} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function GameHubPage() {
  const params = useParams<{ game: string }>();
  const game = GAMES.find((item) => item.slug === params.game);
  const { setSelectedGame } = useGame();

  useEffect(() => { if (game) setSelectedGame(game); }, [game, setSelectedGame]);
  if (!game) return <main className="min-h-screen p-8 text-fn-muted">Game not found.</main>;
  return <GenericHub game={game} />;
}
