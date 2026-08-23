'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Printer, Trophy, X } from 'lucide-react';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { useGame } from '@/context/GameContext';
import html2canvas, { elementToSvgDataUrl } from '@/lib/html2canvas';
import { athleteStatusTone, chessRating, combatAttributes, isChessGame, isFootballGame, isShooterGame, normalizeRating } from '@/lib/athlete-display';
import { GAME_CONTENT } from '@/lib/game-content';
import { formatAthleteSubtitle, getAthleteSubtitleFormat, GAMES } from '@/lib/games';
import BrandedLoader from '@/components/common/BrandedLoader';
import { LoginGate, useAuthGate } from '@/components/common/LoginGate';

type Achievement = { title?: string; date?: string; description?: string };
type Team = { id: string; name: string; logo_url: string | null; rank: number | null; game_slug?: string | null };
type Athlete = {
  id: string;
  name: string;
  ign: string;
  known_name?: string | null;
  team: string | null;
  role: string | null;
  status: string;
  photo_url: string | null;
  overall_rating: number;
  rating: number;
  kills: number;
  assists: number;
  damage: number;
  winrate: number;
  attack?: number | null;
  defense?: number | null;
  survival?: number | null;
  iq?: number | null;
  clutch?: number | null;
  aggression?: number | null;
  jersey_number?: number | string | null;
  previous_aliases?: string[] | string | null;
  previous_teams?: { team: string; years: string }[] | string | null;
  achievements?: Achievement[] | string | null;
  bio: string | null;
  game_slug?: string | null;
  sensitivity_settings?: Record<string, unknown> | string | null;
  control_code?: string | null;
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

function parseObjects<T extends Record<string, unknown> = Achievement>(v: unknown): T[] {
  const a = parseArray(v);
  return (Array.isArray(a) ? a.filter((x) => x && typeof x === 'object') : []) as T[];
}

function achievementSummary(achievement: Achievement, displayName: string) {
  const custom = String(achievement.description ?? '').trim();
  if (custom) return custom;
  const title = String(achievement.title ?? '').trim();
  return title
    ? `${displayName} logged this milestone as part of their verified competitive record on Frag Naija.`
    : `${displayName} has this career milestone attached to their public profile.`;
}

export default function AthletePageClient({ id }: { id: string }) {
  const { selectedGame } = useGame();
  const { user, loading: authLoading } = useAuthGate();
  const [a, setA] = useState<Athlete | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    setLoading(true);
    setNotFound(false);
    setA(null);

    Promise.all([
      fetch(`/api/athletes/${id}`, { next: { revalidate: 120 } }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/teams', { next: { revalidate: 120 } }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([athlete, teamData]) => {
      const fallbackContent = Object.values(GAME_CONTENT);
      const fallbackAthlete = fallbackContent
        .flatMap((content) => content.athletes)
        .find((item) => String(item.id) === id);
      const fallbackTeams = fallbackContent.flatMap((content) => content.teams).map((team) => ({
        id: team.id,
        name: team.name,
        logo_url: team.logo_url,
        rank: team.rank,
        game_slug: team.game_slug,
      }));

      const resolvedAthlete = athlete || (fallbackAthlete ? {
        rating: fallbackAthlete.overall_rating,
        previous_aliases: [],
        previous_teams: [],
        performance_history: [],
        sensitivity_settings: {},
        control_code: '',
        ...fallbackAthlete,
      } as Athlete : null);

      if (resolvedAthlete) {
        setA(resolvedAthlete);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setTeams(Array.isArray(teamData) && teamData.length ? teamData : fallbackTeams);
    }).catch(() => {
      setNotFound(true);
    }).finally(() => setLoading(false));
  }, [authLoading, id, user]);

  const team = useMemo(() => teams.find((t) => t.name === a?.team) ?? null, [a?.team, teams]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><BrandedLoader label="Checking athlete access" /></div>;
  if (!user) return <LoginGate heading="Login to view athlete profile" message="Athlete cards, stats, achievements, loadouts, and profile details are hidden until you log in." next={`/athletes/${id}`} />;
  if (notFound) return <div className="min-h-screen p-8"><p className="text-fn-muted">Athlete not found.</p><Link href="/athletes" className="text-fn-green">Back to roster</Link></div>;

  const activeGame = selectedGame ?? GAMES.find((game) => game.slug === a.game_slug);
  const primary = activeGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const statusTone = athleteStatusTone(a.status, primary);
  const gameName = activeGame?.shortName.toUpperCase() ?? 'ALL GAMES';
  const aliases = parseArray(a.previous_aliases);
  const previousTeams = parseObjects<{ team?: string; years?: string }>(a.previous_teams);
  const achievements = parseObjects<Achievement>(a.achievements);
  const chessProfile = isChessGame(a.game_slug);
  const rating = chessProfile ? chessRating(a.overall_rating, a.rating) : normalizeRating(a.overall_rating, a.rating);
  const footballProfile = isFootballGame(a.game_slug);
  const playerOnlySubtitle = getAthleteSubtitleFormat(a.game_slug) === 'player_only';
  const profileAttrs = combatAttributes(a as unknown as Record<string, unknown>, a.game_slug);
  const showLoadout = isShooterGame(a.game_slug);
  const sensitivityEntries = (() => {
    const value = a.sensitivity_settings;
    if (!value) return [];
    if (typeof value === 'string') {
      try { return Object.entries(JSON.parse(value)); } catch { return value.trim() ? [['Settings', value]] : []; }
    }
    return Object.entries(value);
  })();
  const displayName = a.known_name || a.ign;
  const athleteSubtitle = formatAthleteSubtitle({ gameSlug: a.game_slug, role: a.role, teamName: team?.name || a.team });

  async function handleDownload() {
    const card = document.getElementById('player-card-export');
    if (!card) { console.error('Player card export element was not found'); return; }
    const fileSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setDownloading(true);
    try {
      const canvas = await html2canvas(card, 3);
      downloadDataUrl(canvas.toDataURL('image/png'), `${fileSlug}-frag-naija-player-card.png`);
    } catch (error) {
      console.warn('PNG player card export failed. Falling back to SVG.', error);
      downloadDataUrl(await elementToSvgDataUrl(card), `${fileSlug}-frag-naija-player-card.svg`);
    } finally {
      setDownloading(false);
    }
  }

  function downloadDataUrl(href: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = href;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handlePrint() { window.print(); }

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <div className="screen-profile">
        <Link href="/athletes" className="fn-label">← ALL ATHLETES</Link>

        <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-6">
          <div className="grid gap-5 lg:grid-cols-[230px_1fr] lg:items-center">
            <PlayerCardTemplate athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} variant="featured" className="mx-0" />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[9px] font-black uppercase tracking-widest" style={{ background: statusTone.background, color: statusTone.color, borderColor: statusTone.borderColor }}><span style={{ color: statusTone.dotColor }}>●</span>{a.status}</span><span className="fn-label">{athleteSubtitle}{!playerOnlySubtitle && team?.rank ? ` · rank #${team.rank}` : ''}</span></div>
              <h1 className="font-display text-4xl font-black uppercase text-fn-text">{displayName}</h1>
              <p className="text-xs text-fn-muted">{a.name}{!footballProfile && aliases.length > 0 ? ` · Alias: ${aliases.join(' · ')}` : ''}</p>
              <div className="mt-5 max-w-sm border border-fn-gborder bg-fn-dark/70 p-3">
                <div className="flex justify-between mb-2">
                  <span className="fn-label">{chessProfile ? 'RATING' : 'OVERALL RATING'}</span>
                  <span className="font-display text-xl font-black" style={{ color: primary }}>{rating}</span>
                </div>
                {!chessProfile && <>
                  <div className="h-2 bg-fn-black rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${rating}%`, background: `linear-gradient(90deg, ${primary}60, ${primary})` }}
                    />
                  </div>
                  <div className="fn-label mt-1 text-right">{rating} / 100</div>
                </>}
              </div>
            </div>
          </div>

          {(a.bio || footballProfile) && (
            <div className="mt-5 space-y-3 rounded-sm border border-fn-gborder/70 bg-fn-dark/40 p-4 text-sm leading-7 text-fn-muted sm:p-5">
              <h2 className="fn-label" style={{ color: primary }}>{footballProfile ? 'PLAYER DOSSIER' : 'ATHLETE DOSSIER'}</h2>
              {a.bio ? a.bio.split(/\n{2,}|\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph, index) => (
                <p key={index} className="max-w-prose">{paragraph}</p>
              )) : <p className="max-w-prose">No dossier has been published for this football athlete yet.</p>}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => setCardOpen(true)} className="fn-btn inline-flex items-center gap-2"><Eye size={14} />View Player Card</button>
            <button onClick={handleDownload} disabled={downloading} className="fn-btn-outline inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
            <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
          </div>
        </section>

        <div className={`mt-4 grid gap-3 ${chessProfile ? 'grid-cols-1 max-w-xs' : footballProfile ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
          {profileAttrs.map((stat) => (
            <div key={stat.label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center">
              <div className="font-display text-2xl font-black text-white">{stat.value}</div>
              <div className="fn-label text-fn-green">{stat.label}</div>
            </div>
          ))}
        </div>

        {showLoadout && (
          <article className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-4">
            <h2 className="fn-label mb-3" style={{ color: primary }}>LOADOUT / SETTINGS</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                <div className="fn-label mb-2">Sensitivity</div>
                {sensitivityEntries.length ? sensitivityEntries.map(([key, value]) => (
                  <p key={String(key)} className="flex justify-between gap-3 border-b border-fn-gborder/50 py-1 text-xs last:border-b-0"><span className="capitalize text-fn-muted">{String(key).replaceAll('_', ' ')}</span><span className="font-bold text-fn-text">{String(value)}</span></p>
                )) : <p className="text-xs text-fn-muted">No sensitivity settings recorded.</p>}
              </div>
              <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                <div className="fn-label mb-2">Control Code</div>
                <p className="break-all font-mono text-xs font-bold text-fn-text">{a.control_code || 'No control code recorded.'}</p>
              </div>
            </div>
          </article>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {!footballProfile && <article className="rounded-sm border border-fn-gborder bg-fn-card p-4">
            <h2 className="fn-label mb-3" style={{ color: primary }}>TEAMS</h2>
            <p className="text-xs font-bold text-fn-text">Current: {a.team || 'Free Agent'}</p>
            {previousTeams.map((t, i) => <p key={i} className="mt-2 text-xs text-fn-muted">Previous: {t.team} {t.years}</p>)}
          </article>}
          <article className={`rounded-sm border border-fn-gborder bg-fn-card p-4 ${footballProfile ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <h2 className="fn-label mb-3 flex items-center gap-2"><Trophy size={12} style={{ color: primary }} /> ACHIEVEMENTS / TITLES</h2>
            {achievements.length ? achievements.map((x, i) => (
              <div key={i} className="mb-3 rounded-sm border border-fn-gborder/70 bg-fn-dark/45 p-3 last:mb-0">
                <p className="text-xs font-bold text-fn-text">{x.title} <span className="text-fn-muted">{x.date}</span></p>
                <p className="mt-1 text-[10px] leading-relaxed text-fn-muted">{achievementSummary(x, displayName)}</p>
              </div>
            )) : <p className="text-xs text-fn-muted">No titles recorded yet.</p>}
          </article>
        </div>

        {cardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${displayName} player card`}>
            <div className="max-h-[95vh] w-full max-w-sm overflow-y-auto rounded-sm border border-fn-gborder bg-[#041006] p-4 shadow-2xl" style={{ boxShadow: `0 0 34px ${primary}20` }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="fn-label" style={{ color: primary }}>PUBLIC PLAYER CARD</p>
                  <h2 className="font-display text-xl font-black uppercase text-fn-text">{displayName}</h2>
                </div>
                <button type="button" onClick={() => setCardOpen(false)} className="fn-btn-ghost inline-flex items-center gap-2" aria-label="Close player card"><X size={16} />Close</button>
              </div>
              <PlayerCardTemplate athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button onClick={handleDownload} disabled={downloading} className="fn-btn inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
                <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-card-only"><PlayerCardTemplate athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} /></div>
      <div id="player-card-export" className="pointer-events-none fixed -left-[10000px] top-0 opacity-100" aria-hidden="true"><PlayerCardTemplate athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} /></div>
    </div>
  );
}
