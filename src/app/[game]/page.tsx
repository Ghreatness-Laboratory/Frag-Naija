'use client';

import { useEffect } from 'react';
import type { ElementType } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Crosshair,
  Gamepad2,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { GAMES, type Game } from '@/lib/games';
import { getGameContent } from '@/lib/game-content';
import { useGame } from '@/context/GameContext';

type HubLink = {
  label: string;
  href: string;
  eyebrow: string;
  copy: string;
  icon: ElementType;
};

const PUBG_LINKS: HubLink[] = [
  {
    label: 'Roster Intel',
    href: '/athletes',
    eyebrow: 'Operator scouting',
    copy: 'Compare fraggers, IGLs, support anchors, and public player cards.',
    icon: Crosshair,
  },
  {
    label: 'Squad Rankings',
    href: '/teams',
    eyebrow: 'Power table',
    copy: 'Track Nigerian PUBG squads by wins, kills, strength, and team form.',
    icon: Users,
  },
  {
    label: 'Tournament Ops',
    href: '/tournaments',
    eyebrow: 'Scrims and finals',
    copy: 'Follow live championships, TDM cups, prize pools, and event dates.',
    icon: Trophy,
  },
  {
    label: 'Transfer Watch',
    href: '/transfer-window',
    eyebrow: 'Market movement',
    copy: 'Watch confirmed moves, rumours, and roster rebuilds before events.',
    icon: Activity,
  },
];

const PUBG_MAP_FLOW = [
  { map: 'Erangel', phase: 'Hot drop watch', detail: 'School, Apartments, Pochinki contests' },
  { map: 'Miramar', phase: 'Vehicle priority', detail: 'Long rotations, ridge control, utility patience' },
  { map: 'Sanhok', phase: 'Close-range chaos', detail: 'Fast third parties and compact late circles' },
];

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

function PubgMobileHub({ game }: { game: Game }) {
  const content = getGameContent(game.slug);
  const athletes = content?.athletes.slice(0, 3) ?? [];
  const teams = content?.teams.slice(0, 3) ?? [];
  const tournaments = content?.tournaments.slice(0, 3) ?? [];
  const primary = game.colors.primary;
  const secondary = game.colors.secondary;

  return (
    <main className="min-h-screen overflow-hidden bg-fn-black">
      <section
        className="relative min-h-[74vh] overflow-hidden border-b border-fn-gborder px-4 py-10 sm:px-8 lg:px-12"
        style={{ background: `linear-gradient(140deg, ${primary}10 0%, rgb(var(--fn-black)) 48%, ${secondary}08 100%)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              `linear-gradient(${primary}12 1px, transparent 1px), linear-gradient(90deg, ${primary}12 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
        <div className="fn-scanlines pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="fn-label mb-3 flex items-center gap-2" style={{ color: primary }}>
              <Radio size={12} /> PUBG MOBILE WAR ROOM
            </p>
            <h1 className="font-display text-5xl font-black uppercase leading-none text-fn-text sm:text-7xl">
              Drop. Rotate. Survive.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-fn-muted">
              A dedicated PUBG Mobile homepage for Nigerian battle royale squads, TDM specialists, scrim results, map flow, and player-card scouting.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/athletes" className="fn-btn inline-flex items-center gap-2">
                <Crosshair size={14} /> Scout Operators
              </Link>
              <Link href="/tournaments" className="fn-btn-outline inline-flex items-center gap-2">
                <Trophy size={14} /> View Events
              </Link>
            </div>
          </div>

          <div className="relative border border-fn-gborder bg-fn-card/80 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="fn-label" style={{ color: primary }}>LIVE DROP BOARD</p>
                <h2 className="font-display text-2xl font-black uppercase text-fn-text">{game.name}</h2>
              </div>
              <img src={game.logo} alt={`${game.name} logo`} className="h-14 w-14 object-contain" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Players', value: '30' },
                { label: 'Squads', value: teams.length || 3 },
                { label: 'Events', value: tournaments.length || 3 },
              ].map((item) => (
                <div key={item.label} className="border border-fn-gborder bg-fn-dark p-3 text-center">
                  <div className="font-display text-2xl font-black" style={{ color: primary }}>{item.value}</div>
                  <div className="fn-label">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {PUBG_MAP_FLOW.map((item) => (
                <div key={item.map} className="grid grid-cols-[88px_1fr] gap-3 border border-fn-gborder bg-fn-black/55 p-3">
                  <div>
                    <p className="text-xs font-black uppercase text-fn-text">{item.map}</p>
                    <p className="fn-label mt-1" style={{ color: secondary }}>{item.phase}</p>
                  </div>
                  <p className="text-[10px] leading-relaxed text-fn-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 border-b border-fn-gborder px-4 py-8 sm:px-8 lg:grid-cols-4 lg:px-12">
        {PUBG_LINKS.map(({ label, href, eyebrow, copy, icon: Icon }) => (
          <Link key={href} href={href} className="group border border-fn-gborder bg-fn-card p-4 transition-all hover:bg-fn-card2" onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${primary}70`; }} onMouseLeave={(event) => { event.currentTarget.style.borderColor = 'rgb(var(--fn-gborder))'; }}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center border border-fn-gborder bg-fn-dark">
              <Icon size={16} style={{ color: primary }} />
            </div>
            <p className="fn-label mb-1" style={{ color: primary }}>{eyebrow}</p>
            <h2 className="text-sm font-black uppercase tracking-widest text-fn-text">{label}</h2>
            <p className="mt-2 min-h-[48px] text-[10px] leading-relaxed text-fn-muted">{copy}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: primary }}>
              Open lane <ChevronRight size={10} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_0.82fr] lg:px-12">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="fn-label mb-1 flex items-center gap-1.5" style={{ color: primary }}><ShieldCheck size={10} /> FEATURED OPERATORS</p>
              <h2 className="font-display text-3xl font-black uppercase text-fn-text">PUBG Roster Core</h2>
            </div>
            <Link href="/athletes" className="fn-btn-outline inline-flex items-center gap-2 text-[10px]">View roster <ChevronRight size={11} /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {athletes.map((athlete, index) => (
              <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="group block">
                <PlayerCardTemplate
                  athlete={athlete}
                  rating={athlete.overall_rating}
                  primary={primary}
                  gameName={game.shortName.toUpperCase()}
                  rank={index + 1}
                  variant="featured"
                  className="mx-auto"
                />
              </Link>
            ))}
          </div>
        </div>

        <aside>
          <div className="mb-5">
            <p className="fn-label mb-1 flex items-center gap-1.5" style={{ color: primary }}><CalendarDays size={10} /> TOURNAMENT FEED</p>
            <h2 className="font-display text-3xl font-black uppercase text-fn-text">Next Drops</h2>
          </div>
          <div className="space-y-3">
            {tournaments.map((event) => (
              <Link key={event.id} href="/tournaments" className="block border border-fn-gborder bg-fn-card p-4 transition-all hover:bg-fn-card2" onMouseEnter={(mouseEvent) => { mouseEvent.currentTarget.style.borderColor = `${primary}70`; }} onMouseLeave={(mouseEvent) => { mouseEvent.currentTarget.style.borderColor = 'rgb(var(--fn-gborder))'; }}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: primary }}>{event.status}</span>
                  <span className="fn-label">{event.start_date ? new Date(event.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                </div>
                <h3 className="text-sm font-black uppercase leading-snug text-fn-text">{event.name}</h3>
                <p className="mt-2 text-[10px] leading-relaxed text-fn-muted">{event.format || 'PUBG Mobile event'} in {event.region}</p>
              </Link>
            ))}
          </div>
        </aside>
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
  if (game.slug === 'pubg-mobile') return <PubgMobileHub game={game} />;
  return <GenericHub game={game} />;
}
