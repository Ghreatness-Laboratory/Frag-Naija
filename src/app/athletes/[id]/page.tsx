'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Printer, Shield, Trophy, X } from 'lucide-react';
import { useGame } from '@/context/GameContext';

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
  previous_aliases?: string[] | string | null;
  previous_teams?: { team: string; years: string }[] | string | null;
  achievements?: Achievement[] | string | null;
  bio: string | null;
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

function rankColor(rank?: number | null) {
  if (rank === 1) return '#ffd700';
  if (rank === 2) return '#c0c0c0';
  if (rank === 3) return '#cd7f32';
  return '#00ff41';
}

function loadImage(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
}

function PlayerCard({ athlete, team, rating, achievements, primary }: { athlete: Athlete; team: Team | null; rating: number; achievements: Achievement[]; primary: string }) {
  const displayName = athlete.known_name || athlete.ign;
  const topAchievements = achievements.slice(0, 3);
  return (
    <div id="player-card-print" className="player-card relative mx-auto flex h-[720px] w-[450px] max-w-full flex-col overflow-hidden rounded-2xl border bg-[#061006] p-5 text-white shadow-2xl" style={{ borderColor: `${primary}99` }}>
      <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 50% 0%, ${primary}33, transparent 42%), linear-gradient(145deg, #071707 0%, #020502 100%)` }} />
      <div className="fn-scanlines absolute inset-0 opacity-50" />
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="font-display text-2xl font-black tracking-widest"><span style={{ color: primary }}>FRAG</span>NAIJA</div>
        <div className="rounded-full border px-3 py-1 font-display text-xl font-black" style={{ borderColor: rankColor(team?.rank), color: rankColor(team?.rank) }}>#{team?.rank ?? '—'}</div>
      </div>
      <div className="relative z-10 mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <div className="flex h-72 items-center justify-center" style={{ background: `${primary}14` }}>
          {athlete.photo_url ? <img src={athlete.photo_url} alt={displayName} className="h-full w-full object-cover" /> : <Shield size={96} style={{ color: primary }} />}
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">{athlete.role || 'Player'} · {athlete.status}</p>
          <h2 className="font-display text-5xl font-black uppercase leading-none" style={{ color: primary }}>{displayName}</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/60">{team?.name || athlete.team || 'Free Agent'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-2 text-center">
          <div className="font-display text-4xl font-black" style={{ color: primary }}>{rating}</div>
          <div className="text-[9px] font-bold tracking-widest text-white/50">RTG</div>
        </div>
      </div>
      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
        {[["KLS", athlete.kills], ["WR", `${athlete.winrate}%`], ["AST", athlete.assists]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-black/45 p-3 text-center"><div className="font-display text-2xl font-black text-white">{value}</div><div className="text-[9px] font-bold tracking-widest text-white/45">{label}</div></div>)}
      </div>
      <div className="relative z-10 mt-4 flex-1 rounded-xl border border-white/10 bg-black/35 p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: primary }}><Trophy size={13} /> Achievements</div>
        {topAchievements.length ? topAchievements.map((x, i) => <p key={i} className="mb-2 text-xs font-bold uppercase text-white/80">{x.title} <span className="font-normal text-white/40">{x.date}</span></p>) : <p className="text-xs uppercase text-white/45">No titles recorded yet</p>}
      </div>
      <div className="relative z-10 mt-3 text-center text-[9px] font-bold uppercase tracking-[0.24em] text-white/35">Official Player Card · fragnaija.com</div>
    </div>
  );
}

export default function AthleteDetail({ params }: { params: { id: string } }) {
  const { selectedGame } = useGame();
  const primary = selectedGame.colors.primary;
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
  const rating = Number(a.overall_rating ?? a.rating ?? 0);
  const displayName = a.known_name || a.ign;

  async function handleDownload() {
    if (!a) return;
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = 900;
      canvas.height = 1440;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#061006'; ctx.fillRect(0, 0, 450, 720);
      const gradient = ctx.createRadialGradient(225, 0, 10, 225, 0, 420); gradient.addColorStop(0, primary); gradient.addColorStop(1, '#020502'); ctx.globalAlpha = 0.35; ctx.fillStyle = gradient; ctx.fillRect(0, 0, 450, 720); ctx.globalAlpha = 1;
      ctx.strokeStyle = primary; ctx.lineWidth = 4; ctx.strokeRect(10, 10, 430, 700);
      ctx.fillStyle = primary; ctx.font = '900 24px Arial Black, sans-serif'; ctx.fillText('FRAG', 25, 48); ctx.fillStyle = '#ffffff'; ctx.fillText('NAIJA', 92, 48);
      ctx.strokeStyle = rankColor(team?.rank); ctx.strokeRect(365, 24, 56, 36); ctx.fillStyle = rankColor(team?.rank); ctx.font = '900 22px Arial Black, sans-serif'; ctx.fillText(`#${team?.rank ?? '—'}`, 376, 50);
      const headshot = await loadImage(a.photo_url); ctx.fillStyle = `${primary}22`; ctx.fillRect(35, 80, 380, 285); if (headshot) ctx.drawImage(headshot, 35, 80, 380, 285); else { ctx.strokeStyle = primary; ctx.strokeRect(175, 170, 100, 100); }
      const logo = await loadImage(team?.logo_url); if (logo) { ctx.fillStyle = '#020502'; ctx.beginPath(); ctx.arc(380, 330, 32, 0, Math.PI * 2); ctx.fill(); ctx.drawImage(logo, 352, 302, 56, 56); }
      ctx.fillStyle = '#9ab59a'; ctx.font = '700 11px JetBrains Mono, monospace'; ctx.fillText(`${a.role || 'PLAYER'} · ${a.status}`.toUpperCase(), 35, 400);
      ctx.fillStyle = primary; ctx.font = '900 46px Arial Black, sans-serif'; drawWrappedText(ctx, displayName.toUpperCase(), 35, 448, 295, 46, 2);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 42px Arial Black, sans-serif'; ctx.fillText(String(rating), 355, 438); ctx.fillStyle = '#9ab59a'; ctx.font = '700 10px JetBrains Mono, monospace'; ctx.fillText('RTG', 366, 454);
      ctx.fillStyle = '#b8ccb8'; ctx.font = '700 13px JetBrains Mono, monospace'; drawWrappedText(ctx, (team?.name || a.team || 'Free Agent').toUpperCase(), 35, 493, 360, 16, 2);
      [["KLS", a.kills], ["WR", `${a.winrate}%`], ["AST", a.assists]].forEach(([label, value], i) => { const x = 35 + i * 130; ctx.strokeStyle = '#1a3a1a'; ctx.strokeRect(x, 520, 110, 70); ctx.fillStyle = '#fff'; ctx.font = '900 27px Arial Black, sans-serif'; ctx.fillText(String(value), x + 18, 558); ctx.fillStyle = '#9ab59a'; ctx.font = '700 10px JetBrains Mono, monospace'; ctx.fillText(String(label), x + 41, 578); });
      ctx.fillStyle = primary; ctx.font = '800 12px JetBrains Mono, monospace'; ctx.fillText('ACHIEVEMENTS', 35, 625); ctx.fillStyle = '#ffffff'; ctx.font = '700 12px JetBrains Mono, monospace'; (achievements.slice(0, 3) as Achievement[]).forEach((ach, i) => drawWrappedText(ctx, `• ${ach.title || ''} ${ach.date || ''}`, 35, 650 + i * 22, 380, 14, 1));
      if (!achievements.length) ctx.fillText('No titles recorded yet', 35, 650);
      ctx.fillStyle = '#6f8b6f'; ctx.font = '700 9px JetBrains Mono, monospace'; ctx.fillText('OFFICIAL PLAYER CARD · FRAGNAIJA.COM', 112, 695);
      const link = document.createElement('a'); link.download = `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-frag-naija-player-card.png`; link.href = canvas.toDataURL('image/png'); link.click();
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

          {a.bio && <p className="mt-5 text-sm leading-relaxed text-fn-muted">{a.bio}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => setCardOpen(true)} className="fn-btn inline-flex items-center gap-2"><Eye size={14} />View Player Card</button>
            <button onClick={handleDownload} disabled={downloading} className="fn-btn-outline inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
            <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["KLS", a.kills], ["AST", a.assists], ["DMG", a.damage], ["WR", `${a.winrate}%`]].map(([l, v]) => <div key={l} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center"><div className="font-display text-2xl font-black text-fn-text">{v}</div><div className="fn-label">{l}</div></div>)}
        </div>

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
              <PlayerCard athlete={a} team={team} rating={rating} achievements={achievements} primary={primary} />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button onClick={handleDownload} disabled={downloading} className="fn-btn inline-flex items-center gap-2"><Download size={14} />{downloading ? 'Generating…' : 'Download Player Card'}</button>
                <button onClick={handlePrint} className="fn-btn-outline inline-flex items-center gap-2"><Printer size={14} />Print Player Card</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print-card-only"><PlayerCard athlete={a} team={team} rating={rating} achievements={achievements} primary={primary} /></div>
    </div>
  );
}
