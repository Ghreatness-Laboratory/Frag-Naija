'use client';

import OptimizedImage from '../../../components/common/OptimizedImage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from 'lucide-react';

type Athlete = { id: string; name?: string; ign?: string; known_name?: string; role?: string | null; photo_url?: string | null; status?: string | null };
type FeaturedAthlete = { id: string; athlete_id: string; sort_order: number; athlete: Athlete | null };

function athleteName(athlete?: Athlete | null) {
  return athlete?.known_name || athlete?.ign || athlete?.name || 'Unnamed athlete';
}

export default function AdminFeaturedAthletesPage() {
  const [featured, setFeatured] = useState<FeaturedAthlete[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [featuredRes, athletesRes] = await Promise.all([fetch('/api/featured-athletes', { cache: 'no-store' }), fetch('/api/athletes', { cache: 'no-store' })]);
    setFeatured(featuredRes.ok ? await featuredRes.json() : []);
    setAthletes(athletesRes.ok ? await athletesRes.json() : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedIds = useMemo(() => new Set(featured.map((item) => item.athlete_id)), [featured]);
  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return athletes.filter((athlete) => !selectedIds.has(athlete.id) && `${athlete.name ?? ''} ${athlete.ign ?? ''} ${athlete.known_name ?? ''}`.toLowerCase().includes(needle)).slice(0, 8);
  }, [athletes, query, selectedIds]);

  async function addAthlete(athleteId: string) {
    setMessage('');
    const res = await fetch('/api/featured-athletes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ athlete_id: athleteId }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || 'Unable to add athlete.'); return; }
    setQuery('');
    await load();
  }

  async function remove(id: string) {
    setMessage('');
    const res = await fetch(`/api/featured-athletes/${id}`, { method: 'DELETE' });
    if (!res.ok) setMessage('Unable to remove athlete.');
    await load();
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...featured];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFeatured(next.map((item, sort_order) => ({ ...item, sort_order })));
    const res = await fetch('/api/featured-athletes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: next.map((item) => item.id) }) });
    if (!res.ok) setMessage('Unable to save order.');
    await load();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Featured Athletes</h1>
          <p className="mt-1 text-xs text-fn-muted">Search athletes, add them to the homepage, reorder, or remove.</p>
        </div>
        <span className="rounded border border-fn-green/30 bg-fn-green/10 px-3 py-1 text-xs font-black uppercase text-fn-green">{featured.length} selected</span>
      </div>

      <section className="mb-6 border border-fn-gborder bg-fn-card p-4">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-fn-muted">Search athletes by name / IGN</label>
        <div className="flex items-center gap-2 border border-fn-gborder bg-fn-black px-3 py-2">
          <Search size={14} className="text-fn-green" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type an athlete name or IGN" className="w-full bg-transparent text-sm text-fn-text outline-none" />
        </div>
        {searchResults.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{searchResults.map((athlete) => <button key={athlete.id} type="button" onClick={() => addAthlete(athlete.id)} className="flex items-center justify-between gap-3 border border-fn-gborder bg-fn-black p-3 text-left hover:border-fn-green/50"><span><span className="block text-xs font-black uppercase text-fn-text">{athleteName(athlete)}</span><span className="text-[10px] uppercase text-fn-muted">{athlete.role || 'Athlete'} · {athlete.status || 'Active'}</span></span><Plus size={16} className="text-fn-green" /></button>)}</div>}
      </section>

      {message && <p className="mb-4 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs font-bold text-fn-red">{message}</p>}
      <section className="space-y-2">
        {loading ? <p className="text-xs text-fn-muted">Loading featured athletes…</p> : featured.length === 0 ? <p className="border border-dashed border-fn-gborder bg-fn-card p-5 text-xs text-fn-muted">No featured athletes yet. Search above to add the first card.</p> : featured.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 border border-fn-gborder bg-fn-card p-3">
            <span className="font-display text-lg font-black text-fn-green">#{index + 1}</span>
            <div className="h-12 w-12 shrink-0 overflow-hidden bg-fn-dark">{item.athlete?.photo_url ? <OptimizedImage src={item.athlete.photo_url} alt="" className="h-full w-full object-cover" /> : null}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-black uppercase text-fn-text">{athleteName(item.athlete)}</p><p className="text-[10px] uppercase tracking-widest text-fn-muted">{item.athlete?.role || 'Athlete'} · {item.athlete?.status || 'Active'}</p></div>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="border border-fn-gborder p-2 text-fn-muted hover:text-fn-green disabled:opacity-30"><ArrowUp size={14} /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === featured.length - 1} className="border border-fn-gborder p-2 text-fn-muted hover:text-fn-green disabled:opacity-30"><ArrowDown size={14} /></button>
            <button type="button" onClick={() => remove(item.id)} className="border border-fn-red/30 p-2 text-fn-red hover:bg-fn-red/10"><Trash2 size={14} /></button>
          </div>
        ))}
      </section>
    </div>
  );
}
