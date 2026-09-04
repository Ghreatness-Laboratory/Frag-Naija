'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import CollapsibleText from '@/components/common/CollapsibleText';
import { GAMES } from '@/lib/games';

type Listing = {
  id: string;
  highlight_granted: boolean;
  public_data: Record<string, string | boolean>;
  athlete: { id: string; name: string; ign: string; known_name?: string; game_slug: string; role?: string; photo_url?: string; overall_rating?: number };
};

const fields = [
  { key: 'previous_teams', label: 'Previous teams' },
  { key: 'device_used', label: 'Device' },
  { key: 'availability', label: 'Availability' },
  { key: 'tournaments_free_for', label: 'Free for' },
  { key: 'achievements', label: 'Achievements' },
];

export default function MarketplacePage() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [game, setGame] = useState('');
  const [freeAgent, setFreeAgent] = useState('');
  const [loan, setLoan] = useState('');

  useEffect(() => {
    const query = new URLSearchParams();
    if (game) query.set('game_slug', game);
    if (freeAgent) query.set('free_agent', freeAgent);
    if (loan) query.set('loan_available', loan);
    fetch(`/api/marketplace?${query}`).then((response) => response.ok ? response.json() : []).then(setRows).catch(() => setRows([]));
  }, [game, freeAgent, loan]);

  return <main className="min-h-screen px-4 py-8 sm:px-8 lg:px-12"><section className="mx-auto max-w-7xl">
    <div className="border border-fn-green/30 bg-fn-card p-6"><p className="fn-label text-fn-green">Recruitment board</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-display text-4xl font-black uppercase tracking-widest">Athlete Marketplace</h1><p className="mt-2 max-w-2xl text-sm text-fn-muted">Approved free-agent profiles, ready for teams to scout.</p></div><Link href="/marketplace/manage" className="fn-btn text-center">Manage my listing</Link></div></div>
    <div className="mt-5 grid gap-2 border border-fn-gborder bg-fn-card p-3 sm:grid-cols-3"><select aria-label="Filter by game" value={game} onChange={(event) => setGame(event.target.value)} className="border border-fn-gborder bg-fn-black p-3 text-xs"><option value="">All games</option>{GAMES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select><select aria-label="Filter by free-agent status" value={freeAgent} onChange={(event) => setFreeAgent(event.target.value)} className="border border-fn-gborder bg-fn-black p-3 text-xs"><option value="">All statuses</option><option value="true">Free agent</option><option value="false">Not currently free</option></select><select aria-label="Filter by loan availability" value={loan} onChange={(event) => setLoan(event.target.value)} className="border border-fn-gborder bg-fn-black p-3 text-xs"><option value="">Any loan status</option><option value="true">Available for loan</option><option value="false">Not available for loan</option></select></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map(({ id, athlete, public_data: data, highlight_granted }) => <article key={id} className={`border bg-fn-card p-4 ${highlight_granted ? 'border-fn-yellow shadow-[0_0_18px_rgba(250,204,21,0.14)]' : 'border-fn-gborder'}`}><div className="flex gap-3 border-b border-fn-gborder pb-3"><div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-fn-green/40 bg-fn-black font-display text-xl text-fn-green">{athlete.photo_url ? <img src={athlete.photo_url} alt="" className="h-full w-full object-cover" /> : athlete.ign?.[0]}</div><div><div className="flex flex-wrap items-center gap-2"><p className="font-display text-xl font-black uppercase">{athlete.known_name || athlete.ign || athlete.name}</p>{highlight_granted && <span className="border border-fn-yellow/60 bg-fn-yellow/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-fn-yellow">★ Featured</span>}</div><p className="text-[10px] uppercase tracking-widest text-fn-muted">{athlete.game_slug} · {athlete.role || 'Athlete'} · OVR {athlete.overall_rating ?? '—'}</p><p className="mt-1 text-[10px] font-black uppercase text-fn-green">{data.is_free_agent ? '● Free agent' : '● Open to offers'}</p></div></div><dl className="mt-3 space-y-2 text-xs">{fields.map((field) => data[field.key] ? <div key={field.key}><dt className="fn-label">{field.label}</dt><dd className="mt-0.5 text-fn-text"><CollapsibleText text={String(data[field.key])} /></dd></div> : null)}<div><dt className="fn-label">Loan</dt><dd className="text-fn-text">{data.loan_available ? `Available${data.loan_conditions ? ` — ${data.loan_conditions}` : ''}` : 'Not available'}</dd></div></dl>{data.gameplay_link ? <a href={String(data.gameplay_link)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase text-fn-green">Gameplay <ExternalLink size={12} /></a> : null}</article>)}{!rows.length && <p className="col-span-full border border-fn-gborder bg-fn-card p-10 text-center text-sm text-fn-muted">No approved athletes match these filters yet.</p>}</div>
  </section></main>;
}
