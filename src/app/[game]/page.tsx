'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronRight,
  Gamepad2,
  User,
} from 'lucide-react';
import { GAMES, type Game } from '@/lib/games';
import { useGame } from '@/context/GameContext';

type AuthUser = { id?: string; email?: string; username?: string } | null;

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

function GameLoginGate({ game }: { game: Game }) {
  return <main className="min-h-screen px-4 py-16 text-fn-text"><section className="mx-auto max-w-xl border border-fn-green/30 bg-fn-card p-6 text-center"><User className="mx-auto text-fn-green" size={28} /><p className="fn-label mt-4" style={{ color: game.colors.primary }}>Login Required</p><h1 className="mt-2 font-display text-3xl font-black uppercase tracking-widest">{game.name} is game-scoped</h1><p className="mt-3 text-xs leading-relaxed text-fn-muted">Log in before entering individual game spaces. Once authenticated, the active game context scopes modes, athletes, teams, fantasy, and related records to {game.slug}.</p><Link href="/login" className="mt-5 inline-flex bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Login / Sign Up</Link></section></main>;
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
  const { user, loading } = useAuthGate();

  useEffect(() => { if (game) setSelectedGame(game); }, [game, setSelectedGame]);
  if (!game) return <main className="min-h-screen p-8 text-fn-muted">Game not found.</main>;
  if (loading) return <main className="min-h-screen p-8 text-fn-muted">Checking game access…</main>;
  if (!user) return <GameLoginGate game={game} />;
  return <GenericHub game={game} />;
}
