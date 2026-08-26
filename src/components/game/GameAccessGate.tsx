'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2 } from 'lucide-react';
import { GAMES, type Game } from '@/lib/games';
import { useGame } from '@/context/GameContext';

const LAUNCHED_GAME_SLUGS = new Set(['fc-mobile', 'pubg-mobile']);
const GAME_SCOPED_PATHS = new Set([
  'athletes',
  'teams',
  'tournaments',
  'highlights',
  'transfer-window',
  'games',
  'fantasy-league',
]);

function gameForPath(pathname: string): Game | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return GAMES.find((game) => game.slug === firstSegment) ?? null;
}

function isGameScopedPath(pathname: string) {
  return GAME_SCOPED_PATHS.has(pathname.split('/').filter(Boolean)[0] ?? '');
}

export function isLaunchedGame(game: Pick<Game, 'slug'> | null | undefined) {
  return Boolean(game && LAUNCHED_GAME_SLUGS.has(game.slug));
}

function GameComingSoonTakeover({ game }: { game: Game }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-fn-black px-5 py-12 text-fn-text">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,255,110,.16),transparent_36%),linear-gradient(135deg,rgba(0,200,255,.08),transparent_48%)]" />
      <section className="relative w-full max-w-2xl border border-fn-gborder bg-fn-card/90 p-8 text-center shadow-2xl shadow-black/60 sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border" style={{ borderColor: game.colors.border, background: game.colors.cardBg, color: game.colors.primary }}>
          <Gamepad2 size={28} aria-hidden="true" />
        </div>
        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: game.colors.primary }}>FragNaija game arena</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-wider sm:text-6xl">{game.name}</h1>
        <p className="mt-5 text-lg font-black uppercase tracking-[0.18em]" style={{ color: game.colors.primary }}>Coming Soon</p>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-fn-muted">This game&apos;s arena is still being prepared. FC Mobile and PUBG Mobile are live now; check back soon for {game.name}.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Create account</Link>
          <Link href="/login" className="border px-5 py-3 text-xs font-black uppercase tracking-widest" style={{ borderColor: game.colors.border, color: game.colors.primary }}>Sign in</Link>
        </div>
      </section>
    </main>
  );
}

/** Keeps account and global routes available while replacing restricted game content. */
export default function GameAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const { selectedGame } = useGame();
  const pathGame = gameForPath(pathname);
  const activeGame = pathGame ?? (isGameScopedPath(pathname) ? selectedGame : null);

  if (activeGame && !isLaunchedGame(activeGame)) return <GameComingSoonTakeover game={activeGame} />;
  return <>{children}</>;
}
