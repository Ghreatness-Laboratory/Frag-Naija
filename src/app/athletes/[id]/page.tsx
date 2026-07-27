'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Flag, Printer, Shield, Trophy, X } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import html2canvas from '@/lib/html2canvas';
import { combatAttributes, isShooterGame, normalizeRating } from '@/lib/athlete-display';

type Achievement = { title?: string; date?: string };
type Team = { id: string; name: string; logo_url: string | null; rank: number | null };
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

function PlayerCard({ athlete, team, rating, primary, gameName }: { athlete: Athlete; team: Team | null; rating: number; primary: string; gameName: string }) {
  const displayName = athlete.known_name || athlete.ign;
  const cardNumber = athlete.jersey_number || team?.rank || Math.max(1, Math.round(Number(rating) || 0));
  const stats = combatAttributes(athlete as unknown as Record<string, unknown>);

  return (
    <div
      className="player-card relative mx-auto h-[500px] w-[350px] max-w-full overflow-hidden bg-[#030803] text-white shadow-2xl"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 42px) 0, 100% 42px, 100% calc(100% - 46px), calc(100% - 46px) 100%, 0 100%)',
        background: `linear-gradient(145deg, #020602 0%, #071407 44%, #030803 100%)`,
      }}
    >
      <div className="absolute inset-0 p-[3px]" style={{ background: `linear-gradient(135deg, ${primary}, rgba(255,255,255,0.55), ${primary}66, #061006)` }}>
        <div
          className="h-full w-full bg-[#030803]"
          style={{ clipPath: 'polygon(0 0, calc(100% - 39px) 0, 100% 39px, 100% calc(100% - 43px), calc(100% - 43px) 100%, 0 100%)' }}
        />
      </div>
      <div className="absolute inset-[8px] border border-white/10" style={{ clipPath: 'polygon(0 0, calc(100% - 34px) 0, 100% 34px, 100% calc(100% - 38px), calc(100% - 38px) 100%, 0 100%)' }} />
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 58% 24%, ${primary}3d, transparent 37%), linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.68) 74%)` }} />
      <div className="fn-scanlines absolute inset-0 opacity-30" />

      <div className="absolute left-5 top-5 z-20 rounded-br-2xl rounded-tl-xl border bg-black/70 px-3 py-2 text-center shadow-lg" style={{ borderColor: `${primary}80`, boxShadow: `0 0 22px ${primary}22` }}>
        <div className="font-display text-5xl font-black leading-none" style={{ color: primary }}>{Math.round(Number(rating) || 0)}</div>
        <div className="text-[10px] font-black tracking-[0.28em] text-white/55">RTG</div>
      </div>

      <div className="absolute right-3 top-16 z-20 [writing-mode:vertical-rl] rotate-180 text-[10px] font-black uppercase tracking-[0.35em] text-white/45">NO. {cardNumber}</div>
      <div className="absolute right-2 top-10 z-0 font-display text-[12rem] font-black leading-none opacity-[0.08]" style={{ color: primary }}>{cardNumber}</div>

      <div className="absolute inset-x-0 top-20 z-10 flex h-60 items-end justify-center px-8">
        {athlete.photo_url ? (
          <img src={athlete.photo_url} alt={displayName} className="h-full w-full object-contain object-bottom drop-shadow-[0_24px_24px_rgba(0,0,0,0.75)]" />
        ) : (
          <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-full border bg-black/40" style={{ borderColor: `${primary}70`, color: primary }}>
            <Shield size={82} />
          </div>
        )}
      </div>

      <div className="absolute bottom-[112px] left-6 right-6 z-20">
        <div className="mb-2 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border bg-black/75" style={{ borderColor: `${primary}80` }}>
          {team?.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Flag size={16} style={{ color: primary }} />}
        </div>
        <h2 className="max-w-[250px] font-display text-4xl font-black uppercase leading-[0.86] tracking-tight" style={{ color: primary, textShadow: `0 0 20px ${primary}55` }}>{displayName}</h2>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{team?.name || athlete.team || 'Free Agent'}</p>
      </div>

      <div className="absolute bottom-8 left-5 right-5 z-20 grid grid-cols-5 overflow-hidden rounded-lg border bg-black/78" style={{ borderColor: `${primary}70` }}>
        {stats.map((stat) => (
          <div key={stat.label} className="border-r border-white/10 px-1.5 py-2 text-center last:border-r-0">
            <div className="font-display text-2xl font-black leading-none text-white">{stat.value}</div>
            <div className="mt-1 text-[8px] font-black tracking-widest text-fn-green">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 left-5 z-20 font-display text-sm font-black tracking-widest"><span style={{ color: primary }}>FRAG</span>NAIJA</div>
      <div className="absolute bottom-2 right-6 z-20 text-[8px] font-black uppercase tracking-[0.2em] text-white/45">{gameName}</div>
    </div>
  );
}

export default function AthleteDetail({ params }: { params: { id: string } }) {
  const { selectedGame } = useGame();
  const primary = selectedGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const gameName = selectedGame?.shortName.toUpperCase() ?? 'ALL GAMES';
  const [a, setA] = useState<Athlete | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/athletes/${params.id}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/teams', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([athlete, teamData]) => { setA(athlete); setTeams(teamData); }).finally(() => setLoading(false));
  }, [params.id]);

  const team = useMemo(() => teams.find((t) => t.name === a?.team) ?? null, [a?.team, teams]);

  if (loading) return <div className="min-h-screen p-8 text-fn-muted">Loading athlete…</div>;
  if (!a) return <div className="min-h-screen p-8"><p className="text-fn-muted">Athlete not found.</p><Link href="/athletes" className="text-fn-green">Back to roster</Link></div>;

  const aliases = parseArray(a.previous_aliases);
  const previousTeams = parseObjects<{ team?: string; years?: string }>(a.previous_teams);
  const achievements = parseObjects<Achievement>(a.achievements);
  const rating = normalizeRating(a.overall_rating, a.rating);
  const profileAttrs = combatAttributes(a as unknown as Record<string, unknown>);
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

  async function handleDownload() {
    const card = document.getElementById('player-card-export');
    if (!card) { console.error('Player card export element was not found'); return; }
    setDownloading(true);
    try {
      const canvas = await html2canvas(card, 3);
      const link = document.createElement('a');
      link.download = `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-frag-naija-player-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() { window.print(); }

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <div className="screen-profile">
        <Link href="/athletes" className="fn-label">← ALL ATHLETES</Link>

        <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-sm border" style={{ borderColor: primary, background: `${primary}15` }}>
              {a.photo_url ? <img src={a.photo_url} alt={a.ign} className="h-full w-full object-cover" /> : <Shield style={{ color: primary }} />}
            </div>
            <div className="flex-1">
              <p className="fn-label">{a.status} · {a.role || 'Player'}{team?.rank ? ` · rank #${team.rank}` : ''}</p>
              <h1 className="font-display text-4xl font-black uppercase text-fn-text">{displayName}</h1>
              <p className="text-xs text-fn-muted">{a.name}{aliases.length > 0 ? ` · Alias: ${aliases.join(' · ')}` : ''}</p>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl font-black" style={{ color: primary }}>{rating}</div>
              <div className="fn-label">RTG</div>
            </div>
          </div>

          {a.bio && (
            <div className="mt-5 space-y-3 rounded-sm border border-fn-gborder/70 bg-fn-dark/40 p-4 text-sm leading-7 text-fn-muted sm:p-5">
              {a.bio.split(/\n{2,}|\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean).map((paragraph, index) => (
                <p key={index} className="max-w-prose">{paragraph}</p>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => setCardOpen(true)} className="fn-btn inline-flex items-center gap-2"><Eye size={14} />View Player Card</button>
            <button onClick={handleDownload} disabled={downloading} className="fn-btn-outline inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
            <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {profileAttrs.map((stat) => (
            <div key={stat.label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center">
              <div className="font-display text-2xl font-black text-white">{stat.value}</div>
              <div className="fn-label text-fn-green">{stat.name}</div>
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
          <article className="rounded-sm border border-fn-gborder bg-fn-card p-4">
            <h2 className="fn-label mb-3" style={{ color: primary }}>TEAMS</h2>
            <p className="text-xs font-bold text-fn-text">Current: {a.team || 'Free Agent'}</p>
            {previousTeams.map((t, i) => <p key={i} className="mt-2 text-xs text-fn-muted">Previous: {t.team} {t.years}</p>)}
          </article>
          <article className="rounded-sm border border-fn-gborder bg-fn-card p-4 lg:col-span-2">
            <h2 className="fn-label mb-3 flex items-center gap-2"><Trophy size={12} style={{ color: primary }} /> ACHIEVEMENTS / TITLES</h2>
            {achievements.length ? achievements.map((x, i) => <p key={i} className="mb-2 text-xs text-fn-text">{x.title} <span className="text-fn-muted">{x.date}</span></p>) : <p className="text-xs text-fn-muted">No titles recorded yet.</p>}
          </article>
        </div>

        {cardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${displayName} player card`}>
            <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-fn-gborder bg-fn-card p-4 shadow-2xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="fn-label" style={{ color: primary }}>PUBLIC PLAYER CARD</p>
                  <h2 className="font-display text-xl font-black uppercase text-fn-text">{displayName}</h2>
                </div>
                <button type="button" onClick={() => setCardOpen(false)} className="fn-btn-ghost inline-flex items-center gap-2" aria-label="Close player card"><X size={16} />Close</button>
              </div>
              <PlayerCard athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button onClick={handleDownload} disabled={downloading} className="fn-btn inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
                <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-card-only"><PlayerCard athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} /></div>
      <div id="player-card-export" className="pointer-events-none fixed -left-[10000px] top-0 opacity-100" aria-hidden="true"><PlayerCard athlete={a} team={team} rating={rating} primary={primary} gameName={gameName} /></div>
    </div>
  );
}
