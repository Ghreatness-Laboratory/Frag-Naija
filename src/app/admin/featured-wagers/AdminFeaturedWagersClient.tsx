'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Save } from 'lucide-react';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { GAMES } from '@/lib/games';

type Wager = { id: string; question: string; game_slug?: string | null; pool_total?: number | string | null; trade_count?: number | string | null; trades?: number | string | null; status?: string | null; closes_at?: string | null; featured_on_home?: boolean | null; hot?: boolean | null };
type SortKey = 'newest' | 'pool-desc' | 'pool-asc' | 'trades-desc' | 'trades-asc';

export default function AdminFeaturedWagersPage() {
  const [rows, setRows] = useState<Wager[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [game, setGame] = useState('all');
  const [sort, setSort] = useState<SortKey>('pool-desc');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/wagers', { cache: 'no-store', credentials: 'include' });
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setRows(list);
    setSelected(new Set(list.filter((wager: Wager) => wager.featured_on_home).map((wager: Wager) => wager.id)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const list = game === 'all' ? rows : rows.filter((wager) => wager.game_slug === game);
    return [...list].sort((a, b) => {
      const poolA = Number(a.pool_total ?? 0); const poolB = Number(b.pool_total ?? 0);
      const tradesA = Number(a.trade_count ?? a.trades ?? 0); const tradesB = Number(b.trade_count ?? b.trades ?? 0);
      if (sort === 'pool-desc') return poolB - poolA;
      if (sort === 'pool-asc') return poolA - poolB;
      if (sort === 'trades-desc') return tradesB - tradesA;
      if (sort === 'trades-asc') return tradesA - tradesB;
      return new Date(String(b.closes_at ?? 0)).getTime() - new Date(String(a.closes_at ?? 0)).getTime();
    });
  }, [game, rows, sort]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true); setMessage('');
    const res = await fetch('/api/featured-wagers', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: Array.from(selected) }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMessage(data.error || 'Save failed'); return; }
    setMessage(`Saved ${data.featuredCount} featured wager${data.featuredCount === 1 ? '' : 's'}.`);
    load();
  }

  return <div className="p-8">
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><p className="fn-label mb-2 flex items-center gap-2 text-fn-green"><Flame size={12} /> FEATURED WAGERS</p><h1 className="text-2xl font-black uppercase tracking-widest text-fn-text">Home Featured Wager Selection</h1><p className="mt-2 max-w-3xl text-xs leading-relaxed text-fn-muted">Dedicated replacement for the old buried home toggle. Select the exact existing wager cards shown on Home. “Trades” means the admin-maintained trade_count/manual number of user stake placements displayed for a wager.</p></div><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60"><Save size={14} /> {saving ? 'Saving...' : 'Save Featured Wagers'}</button></div>
    <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]"><AdminGameFilter currentSlug={game} onChange={setGame} /><label className="grid gap-1 text-[10px] font-bold uppercase tracking-widest text-fn-muted">Sort / Stake Pool<select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2 text-xs text-fn-text outline-none"><option value="pool-desc">Stake Pool high → low</option><option value="pool-asc">Stake Pool low → high</option><option value="trades-desc">Trades high → low</option><option value="trades-asc">Trades low → high</option><option value="newest">Closing newest</option></select></label><div className="rounded-sm border border-fn-gborder bg-fn-card p-3"><p className="fn-label">Selected</p><p className="mt-1 text-2xl font-black text-fn-green">{selected.size}</p></div></div>
    {message && <p className="mb-4 rounded-sm border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">{message}</p>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((wager) => { const active = selected.has(wager.id); const gameInfo = GAMES.find((item) => item.slug === wager.game_slug); return <button key={wager.id} type="button" onClick={() => toggle(wager.id)} className={`rounded-sm border p-4 text-left transition-all ${active ? 'border-fn-green bg-fn-green/10' : 'border-fn-gborder bg-fn-card hover:border-fn-green/40'}`}><div className="mb-3 flex items-center justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-widest" style={{ color: gameInfo?.colors.primary ?? 'rgb(var(--fn-green))' }}>{gameInfo?.shortName ?? wager.game_slug ?? 'Game'}</span><span className={active ? 'text-[10px] font-black uppercase text-fn-green' : 'text-[10px] font-black uppercase text-fn-muted'}>{active ? 'Featured' : 'Not featured'}</span></div><h2 className="line-clamp-2 text-sm font-black uppercase tracking-wide text-fn-text">{wager.question}</h2><div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest"><span className="rounded-sm border border-fn-gborder bg-fn-black/40 px-2 py-2 text-fn-muted">Stake Pool<br /><b className="text-fn-text">₦{Number(wager.pool_total ?? 0).toLocaleString()}</b></span><span className="rounded-sm border border-fn-gborder bg-fn-black/40 px-2 py-2 text-fn-muted">Trades<br /><b className="text-fn-text">{Number(wager.trade_count ?? wager.trades ?? 0).toLocaleString()}</b></span></div></button>; })}{!filtered.length && <p className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No wagers match this filter.</p>}</div>
  </div>;
}
