'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Images, Shield, Trophy, Users } from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { useGame } from '@/context/GameContext';
import { DEFAULT_GAME, GAMES } from '@/lib/games';
import { getGameContent } from '@/lib/game-content';
import BrandedLoader from '@/components/common/BrandedLoader';

type Athlete = {
  id: string;
  ign: string;
  name: string;
  role: string | null;
  status: string;
  photo_url: string | null;
  overall_rating: number;
  attack?: number | null;
  defense?: number | null;
  survival?: number | null;
  clutch?: number | null;
  iq?: number | null;
  team?: string | null;
  game_slug?: string | null;
  is_icon?: boolean | null;
};

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  region: string | null;
  wins: number;
  losses: number;
  kills: number;
  rank: number | null;
  strength: number | null;
  points?: number | null;
  form?: string[] | string | null;
  performance_history?: { label: string; value: string; date: string }[] | string | null;
  tournament_results?: { name: string; placement: string; date: string }[] | string | null;
  achievements?: string[] | string | null;
  bio: string | null;
  game_slug?: string | null;
  players: Athlete[];
  organization?: { id: string; name: string; logo_url: string | null } | null;
  gallery?: { id: string; image_url: string; caption: string | null; sort_order: number | null }[];
};

function parseArray(v: unknown) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return String(v).split(',').map((s: string) => s.trim()).filter(Boolean);
  }
}

function parseObjects(v: unknown) {
  const a = parseArray(v);
  return Array.isArray(a) ? a.filter((x) => x && typeof x === 'object') : [];
}

function winRate(w: number, l: number) {
  const t = Number(w) + Number(l);
  return t ? Math.round((Number(w) / t) * 100) : 0;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const team = await fetch(`http://localhost:3000/api/teams/${params.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
    if (team) {
      const imageUrl = team.logo_url || '/og-image.svg';
      const gameName = team.game_slug ? team.game_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Esports';
      
      return {
        title: team.name,
        description: `${team.name} - ${gameName} esports team on FragNaija. View roster, stats, and rankings.`,
        openGraph: {
          title: `${team.name} | FragNaija`,
          description: `${team.name} - ${gameName} esports team on FragNaija.`,
          images: [{ url: imageUrl, width: 400, height: 400, alt: team.name }],
        },
        twitter: {
          title: `${team.name} | FragNaija`,
          description: `${team.name} - ${gameName} esports team on FragNaija.`,
          images: [imageUrl],
          card: 'summary',
        },
      };
    }
  } catch {}
  
  return {
    title: 'Team Profile',
    description: 'View team profile on FragNaija.',
  };
}

export default function TeamDetail({ params }: { params: { id: string } }) {
  const { selectedGame } = useGame();
  const contextGame = selectedGame ?? DEFAULT_GAME;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const activeGame = team?.game_slug ? GAMES.find((game) => game.slug === team.game_slug) ?? contextGame : contextGame;
  const primary = activeGame.colors.primary;
  const secondary = activeGame.colors.secondary;

  useEffect(() => {
    let active = true;

    async function loadTeam() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teams/${params.id}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (active) setTeam(data);
          return;
        }
      } catch {
        // Fall through to static game-content fallback below.
      }

      const fallbackGames = [contextGame, ...GAMES.filter((game) => game.slug !== contextGame.slug)];
      const fallbackTeam = fallbackGames
        .flatMap((game) => (getGameContent(game.slug)?.teams ?? []).map((item) => ({ ...item, game_slug: item.game_slug ?? game.slug })))
        .find((item) => String(item.id) === params.id) as Team | undefined;

      if (active) setTeam(fallbackTeam ?? null);
    }

    loadTeam().finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [params.id, contextGame]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><BrandedLoader label="Loading team" /></div>;
  if (!team) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-fn-muted">Team not found.</p>
        <Link href="/teams" className="text-fn-green">Back to teams</Link>
      </div>
    );
  }

  const form = parseArray(team.form);
  const history = parseObjects(team.performance_history);
  const results = parseObjects(team.tournament_results);
  const achievements = parseArray(team.achievements);

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <Link href="/teams" className="fn-label">← ALL TEAMS</Link>
      <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-sm border" style={{ borderColor: primary, background: `${primary}15` }}>
            {team.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Shield style={{ color: primary }} />}
          </div>
          <div className="flex-1">
            <p className="fn-label">{team.region || 'Nigeria'} · rank #{team.rank ?? '-'}</p>
            <h1 className="font-display text-4xl font-black uppercase text-fn-text">{team.name}</h1>
            {team.organization && (
              <Link href={`/organizations/${team.organization.id}`} className="mt-2 inline-flex items-center gap-2 rounded-sm border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-fn-green">
                Org: {team.organization.name}
              </Link>
            )}
            {team.bio && <p className="mt-2 text-xs leading-relaxed text-fn-muted">{team.bio}</p>}
          </div>
          <div className="text-center">
            <div className="font-display text-5xl font-black" style={{ color: secondary }}>#{team.rank ?? '-'}</div>
            <div className="fn-label">RANK</div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['PTS', team.points ?? team.strength ?? 0],
          ['W', team.wins],
          ['L', team.losses],
          ['WR', `${winRate(team.wins, team.losses)}%`],
          ['KLS', team.kills],
        ].map(([label, value]) => (
          <div key={label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center">
            <div className="font-display text-2xl font-black text-fn-text">{value}</div>
            <div className="fn-label">{label}</div>
          </div>
        ))}
      </div>

      {team.gallery?.length ? (
        <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-4">
          <h2 className="fn-label mb-3 flex items-center gap-2"><Images size={12} style={{ color: primary }} /> GALLERY</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.gallery.map((item) => (
              <figure key={item.id} className="group overflow-hidden rounded-sm border border-fn-gborder bg-fn-black/50">
                <a href={item.image_url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden">
                  <img src={item.image_url} alt={item.caption || `${team.name} gallery photo`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </a>
                {item.caption && <figcaption className="border-t border-fn-gborder px-3 py-2 text-[10px] uppercase tracking-wider text-fn-muted">{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-sm border border-fn-gborder bg-fn-card p-4">
          <h2 className="fn-label mb-3 flex items-center gap-2"><Users size={12} style={{ color: primary }} /> CURRENT ROSTER</h2>
          {team.players?.length ? (
            <div className="space-y-2">
              {team.players.map((player, index) => (
                <Link key={player.id} href={`/athletes/${player.id}`} className="group block">
                  <PlayerCardTemplate
                    athlete={{ ...player, team: team.name, game_slug: player.game_slug ?? activeGame.slug }}
                    team={{ name: team.name, logo_url: team.logo_url, rank: team.rank }}
                    rating={player.overall_rating}
                    primary={primary}
                    gameName={activeGame.shortName.toUpperCase()}
                    rank={index + 1}
                    variant="compact"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-fn-muted">No roster listed.</p>
          )}
        </article>

        <article className="rounded-sm border border-fn-gborder bg-fn-card p-4">
          <h2 className="fn-label mb-3">FORM / PERFORMANCE</h2>
          {form.length ? (
            form.map((f: string) => (
              <span key={f} className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-sm border border-fn-gborder text-xs font-black text-fn-text">{f}</span>
            ))
          ) : history.length ? (
            history.map((h: { label?: string; value?: string; date?: string }, i: number) => (
              <p key={i} className="mb-2 text-xs text-fn-text">
                {h.label}: <span style={{ color: primary }}>{h.value}</span> <span className="text-fn-muted">{h.date}</span>
              </p>
            ))
          ) : (
            <p className="text-xs text-fn-muted">No form history recorded.</p>
          )}
        </article>

        <article className="rounded-sm border border-fn-gborder bg-fn-card p-4">
          <h2 className="fn-label mb-3 flex items-center gap-2"><Trophy size={12} style={{ color: primary }} /> TOURNAMENT RESULTS</h2>
          {results.length ? (
            results.map((r: { name?: string; placement?: string; date?: string }, i: number) => (
              <p key={i} className="mb-2 text-xs text-fn-text">{r.name}: {r.placement} <span className="text-fn-muted">{r.date}</span></p>
            ))
          ) : achievements.length ? (
            achievements.map((achievement: string) => <p key={achievement} className="mb-2 text-xs text-fn-text">{achievement}</p>)
          ) : (
            <p className="text-xs text-fn-muted">No results recorded yet.</p>
          )}
        </article>
      </div>
    </div>
  );
}
