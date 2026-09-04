'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MessageCircle, Users } from 'lucide-react';
import { GAMES } from '@/lib/games';
import BrandedLoader from '@/components/common/BrandedLoader';
import CollapsibleText from '@/components/common/CollapsibleText';

type Community = { id: string; game_slug: string; tier: string; name: string; description: string | null; whatsapp_url: string | null; discord_url: string | null; status: string; sort_order: number };

export default function CommunitiesPage() {
  const [rows, setRows] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameSlug, setGameSlug] = useState('all');
  const [tier, setTier] = useState('all');

  useEffect(() => {
    fetch('/api/communities', { next: { revalidate: 120 } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const tiers = useMemo(() => Array.from(new Set(rows.map((row) => row.tier).filter(Boolean))).sort(), [rows]);
  const filtered = rows.filter((row) => (gameSlug === 'all' || row.game_slug === gameSlug) && (tier === 'all' || row.tier === tier));

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <p className="fn-label mb-2 flex items-center gap-2"><Users size={12} className="text-fn-green" /> OPEN COMMUNITIES</p>
      <h1 className="font-display text-4xl font-black uppercase text-fn-text">Join a Frag Naija Community</h1>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">Browse public WhatsApp and Discord hubs for every supported game and division. No login required.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setGameSlug('all')} className={`rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${gameSlug === 'all' ? 'border-fn-green bg-fn-green/10 text-fn-green' : 'border-fn-gborder text-fn-muted'}`}>All games</button>
        {GAMES.map((game) => <button key={game.slug} onClick={() => setGameSlug(game.slug)} className="rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={gameSlug === game.slug ? { borderColor: game.colors.primary, color: game.colors.primary, background: `${game.colors.primary}12` } : { borderColor: 'rgb(var(--fn-gborder))', color: 'rgb(var(--fn-muted))' }}>{game.shortName}</button>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setTier('all')} className={`rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${tier === 'all' ? 'border-fn-green bg-fn-green/10 text-fn-green' : 'border-fn-gborder text-fn-muted'}`}>All tiers</button>
        {tiers.map((item) => <button key={item} onClick={() => setTier(item)} className={`rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${tier === item ? 'border-fn-green bg-fn-green/10 text-fn-green' : 'border-fn-gborder text-fn-muted'}`}>{item}</button>)}
      </div>

      {loading ? <div className="mt-8 flex justify-center"><BrandedLoader label="Loading communities" /></div> : filtered.length === 0 ? <p className="mt-8 text-xs text-fn-muted">No communities match this filter yet.</p> : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => {
            const game = GAMES.find((item) => item.slug === row.game_slug);
            const primary = game?.colors.primary ?? 'rgb(var(--fn-green))';
            return <article key={row.id} className="rounded-sm border border-fn-gborder bg-fn-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="fn-label" style={{ color: primary }}>{game?.name ?? row.game_slug} · {row.tier}</p><h2 className="mt-1 text-base font-black uppercase text-fn-text">{row.name}</h2></div><MessageCircle size={18} style={{ color: primary }} /></div>{row.description && <CollapsibleText text={row.description} className="mt-3 text-[11px] leading-relaxed text-fn-muted" />}<div className="mt-5 flex flex-wrap gap-2">{row.whatsapp_url && <a href={row.whatsapp_url} target="_blank" rel="noreferrer" className="fn-btn inline-flex items-center gap-2 text-[10px]">WhatsApp <ChevronRight size={12} /></a>}{row.discord_url && <a href={row.discord_url} target="_blank" rel="noreferrer" className="fn-btn-outline inline-flex items-center gap-2 text-[10px]">Discord <ChevronRight size={12} /></a>}</div></article>;
          })}
        </div>
      )}
    </main>
  );
}
