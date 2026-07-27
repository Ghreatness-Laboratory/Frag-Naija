'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import { GAMES } from '@/lib/games';
import { useGame } from '@/context/GameContext';

export default function GameHubPage() {
  const params = useParams<{ game: string }>();
  const game = GAMES.find((item) => item.slug === params.game);
  const { setSelectedGame } = useGame();

  useEffect(() => { if (game) setSelectedGame(game); }, [game, setSelectedGame]);
  if (!game) return <main className="min-h-screen p-8 text-fn-muted">Game not found.</main>;

  const links = [
    ['Athletes', '/athletes'], ['Teams', '/teams'], ['Tournaments', '/tournaments'], ['Wager', '/wager'], ['Shop', '/shop'], ['Transfers', '/transfer-window'],
  ];

  return <main className="min-h-screen px-4 py-16 sm:px-8 lg:px-12"><section className="rounded-sm border border-fn-gborder bg-fn-card p-8" style={{ background: `linear-gradient(135deg, ${game.colors.primary}10, rgb(var(--fn-black)) 70%)` }}><p className="fn-label mb-3 flex items-center gap-2"><Gamepad2 size={12} style={{ color: game.colors.primary }} /> GAME SPACE</p><h1 className="font-display text-5xl font-black uppercase text-fn-text">{game.name}</h1><p className="mt-2 max-w-xl text-xs leading-relaxed text-fn-muted">You are now browsing the {game.name} space. The sections below use the selected game context and only show records tagged with <span style={{ color: game.colors.primary }}>{game.slug}</span>.</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{links.map(([label, href]) => <Link key={href} href={href} className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark p-4 text-xs font-bold uppercase tracking-widest text-fn-text hover:border-fn-green/40"><span>{label}</span><ChevronRight size={14} style={{ color: game.colors.primary }} /></Link>)}</div></section></main>;
}
