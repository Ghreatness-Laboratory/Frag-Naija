'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Printer, Shield, Trophy } from 'lucide-react';
import { useGame } from '@/context/GameContext';

type Achievement = { title?: string; date?: string };
type TeamHistory = { team?: string; years?: string };
type Athlete = {
  id: string;
  name: string;
  ign: string;
  known_name?: string | null;
  team: string | null;
  role: string | null;
  status: string;
  photo_url: string | null;
  overall_rating?: number | null;
  rating?: number | null;
  kills?: number | null;
  assists?: number | null;
  damage?: number | null;
  winrate?: number | null;
  previous_aliases?: string[] | string | null;
  previous_teams?: TeamHistory[] | string | null;
  achievements?: Achievement[] | string | null;
  bio: string | null;
};
type Team = { id: string; name: string; logo_url: string | null; rank: number | null };

function parseArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  }
}

function parseObjects<T extends Record<string, string | undefined>>(value: unknown): T[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : (() => { try { return JSON.parse(String(value)); } catch { return []; } })();
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === 'object') as T[];
}

function ratingFor(athlete: Athlete) {
  return Number(athlete.overall_rating ?? athlete.rating ?? 0);
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function AthleteDetail({ params }: { params: { id: string } }) {
  const { selectedGame } = useGame();
  const primary = selectedGame.colors.primary;
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/athletes/${params.id}`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/athletes', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
      fetch('/api/teams', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ]).then(([profile, roster, teams]: [Athlete | null, Athlete[], Team[]]) => {
      setAthlete(profile);
      setAllAthletes(Array.isArray(roster) ? roster : []);
      setTeam(profile?.team ? teams.find((item) => item.name === profile.team) ?? null : null);
      setLoading(false);
    });
  }, [params.id]);

  const aliases = parseArray(athlete?.previous_aliases);
  const teams = parseObjects<TeamHistory>(athlete?.previous_teams);
  const achievements = parseObjects<Achievement>(athlete?.achievements);
  const rating = athlete ? ratingFor(athlete) : 0;
  const rank = useMemo(() => {
    if (!athlete || allAthletes.length === 0) return null;
    const sorted = [...allAthletes].sort((a, b) => ratingFor(b) - ratingFor(a));
    const index = sorted.findIndex((item) => item.id === athlete.id);
    return index >= 0 ? index + 1 : null;
  }, [allAthletes, athlete]);

  async function downloadPlayerCard() {
    if (!athlete) return;
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      const width = 420;
      const height = 640;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#050806';
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width / 2, 80, 10, width / 2, 80, 360);
      glow.addColorStop(0, `${primary}66`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, width - 28, height - 28);
      ctx.strokeStyle = `${primary}66`;
      ctx.lineWidth = 1;
      for (let y = 44; y < height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(width - 24, y);
        ctx.stroke();
      }

      ctx.fillStyle = primary;
      ctx.font = '700 13px Arial';
      ctx.fillText('FRAG NAIJA PLAYER CARD', 32, 48);
      ctx.fillStyle = '#f5fff7';
      ctx.font = '900 34px Arial';
      ctx.fillText((athlete.known_name || athlete.ign).toUpperCase().slice(0, 18), 32, 96);
      ctx.fillStyle = '#8aa093';
      ctx.font = '700 13px Arial';
      ctx.fillText(`${athlete.name}${athlete.role ? ` · ${athlete.role}` : ''}`, 32, 120);

      const photo = athlete.photo_url ? await loadImage(athlete.photo_url) : null;
      ctx.fillStyle = '#101812';
      ctx.fillRect(32, 146, 220, 260);
      ctx.strokeStyle = primary;
      ctx.strokeRect(32, 146, 220, 260);
      if (photo) ctx.drawImage(photo, 32, 146, 220, 260);
      else {
        ctx.fillStyle = `${primary}33`;
        ctx.fillRect(32, 146, 220, 260);
        ctx.fillStyle = primary;
        ctx.font = '900 92px Arial';
        ctx.fillText(athlete.ign[0].toUpperCase(), 104, 300);
      }

      const logo = team?.logo_url ? await loadImage(team.logo_url) : null;
      ctx.fillStyle = '#0c120e';
      ctx.fillRect(272, 146, 116, 86);
      ctx.strokeStyle = `${primary}88`;
      ctx.strokeRect(272, 146, 116, 86);
      if (logo) ctx.drawImage(logo, 294, 154, 72, 72);
      else {
        ctx.fillStyle = primary;
        ctx.font = '900 40px Arial';
        ctx.fillText((athlete.team || 'F')[0].toUpperCase(), 310, 200);
      }
      ctx.fillStyle = '#8aa093';
      ctx.font = '700 10px Arial';
      ctx.fillText('CURRENT TEAM', 272, 256);
      ctx.fillStyle = '#f5fff7';
      ctx.font = '900 16px Arial';
      ctx.fillText((athlete.team || 'Free Agent').slice(0, 13), 272, 280);

      ctx.fillStyle = primary;
      ctx.font = '900 48px Arial';
      ctx.fillText(rank ? `#${rank}` : '#—', 282, 354);
      ctx.fillStyle = '#8aa093';
      ctx.font = '700 10px Arial';
      ctx.fillText('RANK BADGE', 284, 374);

      const statRows = [['KLS', athlete.kills ?? 0], ['WR', `${athlete.winrate ?? 0}%`], ['RTG', rating.toFixed(1)]];
      statRows.forEach(([label, value], index) => {
        const x = 32 + index * 122;
        ctx.fillStyle = '#0c120e';
        ctx.fillRect(x, 430, 104, 74);
        ctx.strokeStyle = `${primary}77`;
        ctx.strokeRect(x, 430, 104, 74);
        ctx.fillStyle = '#f5fff7';
        ctx.font = '900 24px Arial';
        ctx.fillText(String(value), x + 16, 468);
        ctx.fillStyle = '#8aa093';
        ctx.font = '700 11px Arial';
        ctx.fillText(String(label), x + 16, 488);
      });

      ctx.fillStyle = primary;
      ctx.font = '800 12px Arial';
      ctx.fillText('ACHIEVEMENTS', 32, 536);
      ctx.fillStyle = '#f5fff7';
      ctx.font = '700 12px Arial';
      const titles = achievements.slice(0, 3).map((item) => item.title).filter(Boolean);
      (titles.length ? titles : [`${achievements.length} title(s) recorded`]).forEach((title, index) => {
        ctx.fillText(`• ${title}`.slice(0, 46), 32, 562 + index * 22);
      });
      ctx.fillStyle = primary;
      ctx.font = '900 15px Arial';
      ctx.fillText('FRAGNAIJA', 292, 610);

      const link = document.createElement('a');
      link.download = `${athlete.ign.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-player-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setGenerating(false);
    }
  }

  function printPlayerCard() {
    if (!cardRef.current) return;
    const printWindow = window.open('', '_blank', 'width=520,height=760');
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html><html><head><title>Player Card</title><style>@page{size:4in 6in;margin:0.15in}body{margin:0;background:#050806;display:grid;place-items:center;min-height:100vh;font-family:Arial,sans-serif}.card{width:4in;height:6in;box-sizing:border-box}</style></head><body>${cardRef.current.outerHTML}<script>window.onload=()=>{window.print();window.close();}</script></body></html>`);
    printWindow.document.close();
  }

  if (loading) return <div className="min-h-screen p-8 text-fn-muted">Loading athlete…</div>;
  if (!athlete) return <div className="min-h-screen p-8"><p className="text-fn-muted">Athlete not found.</p><Link href="/athletes" className="text-fn-green">Back to roster</Link></div>;

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <Link href="/athletes" className="fn-label">← ALL ATHLETES</Link>
      <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-sm border" style={{ borderColor: primary, background: `${primary}15` }}>
            {athlete.photo_url ? <img src={athlete.photo_url} alt={athlete.ign} className="h-full w-full object-cover" /> : <Shield style={{ color: primary }} />}
          </div>
          <div className="flex-1">
            <p className="fn-label">{athlete.status} · {athlete.role || 'Player'}</p>
            <h1 className="font-display text-4xl font-black uppercase text-fn-text">{athlete.known_name || athlete.ign}</h1>
            <p className="text-xs text-fn-muted">{athlete.name}{aliases.length > 0 ? ` · Alias: ${aliases.join(' · ')}` : ''}</p>
          </div>
          <div className="text-center"><div className="font-display text-5xl font-black" style={{ color: primary }}>{rating}</div><div className="fn-label">RTG</div></div>
        </div>
        {athlete.bio && <p className="mt-5 text-sm leading-relaxed text-fn-muted">{athlete.bio}</p>}
      </section>

      <section className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['KLS', athlete.kills ?? 0], ['AST', athlete.assists ?? 0], ['DMG', athlete.damage ?? 0], ['WR', `${athlete.winrate ?? 0}%`]].map(([label, value]) => <div key={label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center"><div className="font-display text-2xl font-black text-fn-text">{value}</div><div className="fn-label">{label}</div></div>)}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <article className="rounded-sm border border-fn-gborder bg-fn-card p-4"><h2 className="fn-label mb-3" style={{ color: primary }}>TEAMS</h2><p className="text-xs font-bold text-fn-text">Current: {athlete.team || 'Free Agent'}</p>{teams.map((item, index) => <p key={index} className="mt-2 text-xs text-fn-muted">Previous: {item.team} {item.years}</p>)}</article>
            <article className="rounded-sm border border-fn-gborder bg-fn-card p-4 lg:col-span-2"><h2 className="fn-label mb-3 flex items-center gap-2"><Trophy size={12} style={{ color: primary }} /> ACHIEVEMENTS / TITLES</h2>{achievements.length ? achievements.map((item, index) => <p key={index} className="mb-2 text-xs text-fn-text">{item.title} <span className="text-fn-muted">{item.date}</span></p>) : <p className="text-xs text-fn-muted">No titles recorded yet.</p>}</article>
          </div>
        </div>

        <aside className="rounded-sm border border-fn-gborder bg-fn-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><p className="fn-label" style={{ color: primary }}>PLAYER CARD</p><h2 className="font-display text-xl font-black uppercase text-fn-text">Download / Print</h2></div>
            <div className="flex gap-2">
              <button onClick={downloadPlayerCard} disabled={generating} className="inline-flex items-center gap-1 rounded-sm px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-60" style={{ background: primary }}><Download size={12} /> {generating ? 'Generating' : 'Download'}</button>
              <button onClick={printPlayerCard} className="inline-flex items-center gap-1 rounded-sm border border-fn-gborder px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-text"><Printer size={12} /> Print</button>
            </div>
          </div>
          <div ref={cardRef} className="card mx-auto aspect-[2/3] w-full max-w-[420px] overflow-hidden rounded-xl border-2 bg-[#050806] p-5 shadow-2xl" style={{ borderColor: primary, boxShadow: `0 0 32px ${primary}30`, backgroundImage: `radial-gradient(circle at 50% 0%, ${primary}44, transparent 45%)` }}>
            <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: primary }}>Frag Naija</span><span className="rounded-sm border px-2 py-1 text-xs font-black" style={{ borderColor: `${primary}88`, color: primary }}>{rank ? `#${rank}` : '#—'}</span></div>
            <h3 className="mt-4 font-display text-3xl font-black uppercase leading-none text-fn-text">{athlete.known_name || athlete.ign}</h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-fn-muted">{athlete.role || 'Player'} · {athlete.team || 'Free Agent'}</p>
            <div className="mt-4 grid grid-cols-[1fr_90px] gap-3">
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-sm border bg-fn-dark" style={{ borderColor: `${primary}88` }}>{athlete.photo_url ? <img src={athlete.photo_url} alt={athlete.ign} className="h-full w-full object-cover" /> : <span className="font-display text-7xl font-black" style={{ color: primary }}>{athlete.ign[0]}</span>}</div>
              <div className="space-y-3"><div className="flex h-20 items-center justify-center overflow-hidden rounded-sm border bg-fn-dark" style={{ borderColor: `${primary}66` }}>{team?.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Shield style={{ color: primary }} />}</div><div className="rounded-sm border border-fn-gborder bg-black/35 p-2 text-center"><div className="font-display text-3xl font-black" style={{ color: primary }}>{rating.toFixed(1)}</div><div className="fn-label">RTG</div></div></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['KLS', athlete.kills ?? 0], ['WR', `${athlete.winrate ?? 0}%`], ['RTG', rating.toFixed(1)]].map(([label, value]) => <div key={label} className="rounded-sm border border-fn-gborder bg-black/35 p-2"><div className="font-display text-lg font-black text-fn-text">{value}</div><div className="fn-label">{label}</div></div>)}</div>
            <div className="mt-4"><div className="fn-label mb-2" style={{ color: primary }}>TOP TITLES</div>{achievements.length ? achievements.slice(0, 3).map((item, index) => <p key={index} className="truncate text-[10px] font-bold text-fn-text">✦ {item.title}</p>) : <p className="text-[10px] text-fn-muted">No titles recorded yet.</p>}</div>
          </div>
        </aside>
      </section>
    </div>
  );
}
