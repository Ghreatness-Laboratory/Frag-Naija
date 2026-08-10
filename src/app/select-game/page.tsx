'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Shield, Zap } from 'lucide-react';
import { GAMES, type Game } from '@/lib/games';
import { useGame } from '@/context/GameContext';

// ─── Logo component with graceful SVG/image fallback ────────────────────────

function GameLogo({ game, isSelected }: { game: Game; isSelected: boolean }) {
  const [errored, setErrored] = useState(false);

  const style = isSelected
    ? { filter: `drop-shadow(0 0 10px ${game.colors.primary})` }
    : {};

  if (errored) {
    // Styled text fallback — replace logo files in public/logos/ to remove this
    return (
      <div
        className="flex h-16 w-16 items-center justify-center rounded-sm text-sm font-black sm:h-20 sm:w-20"
        style={{
          background: game.colors.cardBg,
          border: `1px solid ${game.colors.border}`,
          color: game.colors.primary,
          fontFamily: 'Impact, Arial Black, sans-serif',
          letterSpacing: '0.1em',
        }}
      >
        {game.shortName.split(' ')[0].slice(0, 4)}
      </div>
    );
  }

  return (
    /* Using <img> here so SVGs work without next/image domain config.
       Swap to <Image> from 'next/image' once real PNG logos are in place. */
    <img
      src={game.logo}
      alt={`${game.name} logo`}
      width={80}
      height={80}
      className="h-16 w-16 object-contain sm:h-20 sm:w-20"
      style={style}
      onError={() => setErrored(true)}
    />
  );
}

// ─── Individual game card ─────────────────────────────────────────────────────

function GameCard({
  game,
  isSelected,
  onSelect,
}: {
  game: Game;
  isSelected: boolean;
  onSelect: (g: Game) => void;
}) {
  return (
    <button
      onClick={() => game.available && onSelect(game)}
      disabled={!game.available}
      aria-pressed={isSelected}
      aria-label={game.name}
      className={[
        'group relative flex flex-col items-center gap-3 rounded-sm border p-4 text-left transition-all duration-300 sm:p-5',
        game.available ? 'cursor-pointer' : 'cursor-not-allowed',
        !isSelected ? 'border-fn-gborder bg-fn-card' : '',
        !game.available ? 'opacity-45' : '',
      ].join(' ')}
      style={
        isSelected
          ? {
              borderColor: game.colors.border,
              background: game.colors.cardBg,
              boxShadow: `0 0 24px ${game.colors.glow}, 0 0 48px ${game.colors.glow.replace('0.35', '0.08')}`,
            }
          : {}
      }
    >
      {/* FEATURED / badge */}
      {game.badge && (
        <span
          className="absolute -top-px left-3 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest"
          style={{ background: game.colors.primary, color: 'rgb(var(--fn-black))' }}
        >
          {game.badge}
        </span>
      )}


      {/* Logo */}
      <GameLogo game={game} isSelected={isSelected} />

      {/* Label */}
      <div className="w-full text-center">
        <p
          className="font-display text-sm font-black uppercase tracking-wider transition-colors"
          style={{ color: isSelected ? game.colors.primary : 'rgb(var(--fn-text))' }}
        >
          {game.shortName}
        </p>
        <p className="mt-0.5 text-[8px] font-mono leading-snug text-fn-muted">
          {game.description}
        </p>
      </div>

      {/* Selected tick */}
      {isSelected && (
        <span
          className="absolute bottom-2 right-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
          style={{ background: game.colors.primary, color: 'rgb(var(--fn-black))' }}
        >
          ✓
        </span>
      )}

      {/* Hover border overlay for available, unselected cards */}
      {game.available && !isSelected && (
        <span
          className="pointer-events-none absolute inset-0 rounded-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${game.colors.border}` }}
        />
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SelectGamePage() {
  const router = useRouter();
  const { selectedGame, setSelectedGame, isHydrated } = useGame();
  const [picked, setPicked] = useState<Game | null>(null);
  const [allGamesPicked, setAllGamesPicked] = useState(true);

  // Pre-select All Games for first-time/neutral visitors, or the stored active game when present.
  useEffect(() => {
    if (!isHydrated) return;
    if (selectedGame) {
      setPicked(selectedGame);
      setAllGamesPicked(false);
    } else {
      setPicked(null);
      setAllGamesPicked(true);
    }
  }, [isHydrated, selectedGame]);

  function handleContinue() {
    if (allGamesPicked) {
      setSelectedGame(null);
      router.push('/');
      return;
    }
    if (!picked) return;
    setSelectedGame(picked);       // → writes localStorage + sets fn-game cookie
    router.push(`/${picked.slug}`);
  }

  const btnStyle = allGamesPicked
    ? {
        background: 'rgb(var(--fn-green))',
        color: 'rgb(var(--fn-black))',
        boxShadow: '0 0 20px rgb(var(--fn-green) / 0.28)',
      }
    : picked
    ? {
        background: picked.colors.primary,
        color: 'rgb(var(--fn-black))',
        boxShadow: `0 0 20px ${picked.colors.glow}`,
      }
    : {
        background: 'transparent',
        border: '1px solid rgb(var(--fn-gborder))',
        color: 'rgb(var(--fn-muted))',
        cursor: 'not-allowed',
      };

  return (
    /*
     * Fixed full-screen overlay — sits above Navbar (z-50) and DisclaimerModal (z-[100]).
     * The root layout Navbar is intentionally hidden beneath this overlay
     * until the user selects a game and continues.
     */
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-fn-black">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--fn-green) / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fn-green) / 0.045) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial glow from top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 35% at 50% 0%, rgb(var(--fn-green) / 0.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex min-h-screen flex-col">
        {/* ── Header ── */}
        <header className="flex items-center justify-between border-b border-fn-gborder px-6 py-4">
          <div className="flex items-center gap-2">
            <span
              className="font-display text-xl font-black tracking-widest text-[rgb(var(--fn-green))]"
              style={{ textShadow: '0 0 20px rgb(var(--fn-green) / 0.35)' }}
            >
              FRAG
            </span>
            <span className="font-display text-xl font-black tracking-widest text-fn-text">
              NAIJA
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.15em] text-fn-muted">
            <Zap size={9} className="text-[rgb(var(--fn-green))]" />
            Nigeria&apos;s Premier Esports Platform
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
          {/* Step tag */}
          <div className="mb-6 flex items-center gap-2 rounded-sm border border-fn-gborder bg-fn-card px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-fn-muted">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[rgb(var(--fn-green))]" />
            Step 01 — Game Select
          </div>

          {/* Heading */}
          <div className="mb-3 text-center">
            <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight text-fn-text sm:text-6xl">
              SELECT YOUR{' '}
              <span
                className="text-[rgb(var(--fn-green))]"
                style={{ textShadow: '0 0 28px rgb(var(--fn-green) / 0.35)' }}
              >
                GAME
              </span>
            </h1>
          </div>
          <p className="mb-10 max-w-md text-center text-[11px] font-mono leading-relaxed text-fn-muted">
            Choose All Games for the neutral combined dashboard, or pick a single title for game-scoped content.
          </p>

          {/* ── Game grid ── */}
          <div className="mb-10 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          <button
              type="button"
              onClick={() => { setAllGamesPicked(true); setPicked(null); }}
              className={`group relative overflow-hidden rounded-sm border bg-fn-card p-4 text-left transition-all duration-300 ${allGamesPicked ? 'scale-[1.02]' : 'hover:-translate-y-1'}`}
              style={{ borderColor: allGamesPicked ? 'rgb(var(--fn-green))' : 'rgb(var(--fn-gborder))', boxShadow: allGamesPicked ? '0 0 24px rgb(var(--fn-green) / 0.18)' : undefined }}
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm border border-fn-green/40 bg-fn-green/10 text-fn-green">ALL</span>
              <span className="block text-sm font-black uppercase tracking-widest text-fn-text">All Games</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-fn-muted">Neutral homepage with admin-curated cross-game highlights.</span>
            </button>
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={!allGamesPicked && picked?.id === game.id}
                onSelect={(game) => { setPicked(game); setAllGamesPicked(false); }}
              />
            ))}
          </div>

          {/* ── Selection summary ── */}
          {(picked || allGamesPicked) && (
            <div
              className="mb-6 flex items-center gap-3 rounded-sm border px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest"
              style={{
                borderColor: allGamesPicked ? 'rgb(var(--fn-green) / 0.4)' : picked!.colors.border,
                background: allGamesPicked ? 'rgb(var(--fn-green) / 0.05)' : picked!.colors.cardBg,
                color: allGamesPicked ? 'rgb(var(--fn-green))' : picked!.colors.primary,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: allGamesPicked ? 'rgb(var(--fn-green))' : picked!.colors.primary }} />
              {allGamesPicked ? 'All Games selected' : `${picked!.name} selected`}
            </div>
          )}

          {/* ── Continue button ── */}
          <button
            onClick={handleContinue}
            disabled={!picked && !allGamesPicked}
            className="flex items-center gap-2.5 rounded-sm px-10 py-3.5 font-display text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 active:scale-95"
            style={btnStyle}
          >
            {allGamesPicked ? 'Enter All Games Dashboard' : picked ? `Enter as ${picked.shortName} Player` : 'Select a Game First'}
            <ChevronRight size={15} />
          </button>

          {/* Fine print */}
          <p className="mt-4 flex items-center gap-1.5 text-[9px] font-mono text-fn-muted">
            <Shield size={8} />
            You can switch games at any time from your profile settings
          </p>

        </main>

        {/* ── Footer strip ── */}
        <footer className="border-t border-fn-gborder px-6 py-3 text-center text-[8px] font-mono text-fn-muted/80">
          © {new Date().getFullYear()} Frag Naija — Nigeria&apos;s Premier Esports Platform
        </footer>
      </div>
    </div>
  );
}
