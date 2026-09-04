'use client';

import { useCallback, useEffect, useState } from 'react';

type Row = {
  id: string;
  review_status: string;
  highlight_requested: boolean;
  highlight_granted: boolean;
  pending_data: Record<string, unknown>;
  reviewer_note?: string;
  display_name?: string;
  ign?: string;
  game_slug?: string;
};

export default function AdminMarketplacePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/marketplace');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load marketplace listings.');
    setRows(data);
  }, []);

  useEffect(() => {
    load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load marketplace listings.'));
  }, [load]);

  const review = async (id: string, action: string) => {
    setActing(`${id}:${action}`);
    setError('');
    try {
      const response = await fetch(`/api/admin/marketplace/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note[id] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update listing.');
      await load();
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : 'Could not update listing.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-8">
      <p className="fn-label text-fn-green">Moderation queue</p>
      <h1 className="font-display text-3xl font-black uppercase">Athlete Marketplace</h1>
      {error && <p className="mt-4 border border-fn-red/30 bg-fn-red/10 p-3 text-sm text-fn-red">{error}</p>}
      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const pendingOrReviewed = ['pending', 'approved', 'changes_requested'].includes(row.review_status);
          return (
            <article key={row.id} className="border border-fn-gborder bg-fn-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-black uppercase">
                  {row.display_name || row.ign || 'Unnamed listing'} <span className="text-xs text-fn-muted">{row.game_slug}</span>
                </h2>
                <span className="border border-fn-green/30 px-2 py-1 text-[10px] font-black uppercase text-fn-green">{row.review_status.replace('_', ' ')}</span>
              </div>
              {pendingOrReviewed && row.highlight_requested && <p className="mt-3 inline-block border border-fn-yellow/50 bg-fn-yellow/10 px-2 py-1 text-xs font-bold text-fn-yellow">★ Highlight requested</p>}
              {row.highlight_granted && <p className="mt-3 inline-block border border-fn-yellow/50 bg-fn-yellow/10 px-2 py-1 text-xs font-bold text-fn-yellow">★ Highlight granted</p>}
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(row.pending_data || {}).filter(([key]) => key !== 'highlight_requested').map(([key, value]) => <div key={key}><dt className="fn-label">{key.replaceAll('_', ' ')}</dt><dd className="whitespace-pre-wrap text-sm">{String(value)}</dd></div>)}
              </dl>
              <textarea value={note[row.id] || ''} onChange={(event) => setNote({ ...note, [row.id]: event.target.value })} placeholder="Optional reviewer note / rejection reason" className="mt-4 min-h-16 w-full border border-fn-gborder bg-fn-black p-2 text-xs" disabled={acting !== null} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => review(row.id, 'approve')} disabled={acting !== null} className="bg-fn-green px-3 py-2 text-xs font-black uppercase text-fn-black disabled:opacity-50">{acting === `${row.id}:approve` ? 'Approving…' : 'Approve'}</button>
                <button onClick={() => review(row.id, 'request_changes')} disabled={acting !== null} className="border border-fn-yellow/50 px-3 py-2 text-xs font-black uppercase text-fn-yellow disabled:opacity-50">Request edits</button>
                <button onClick={() => review(row.id, 'reject')} disabled={acting !== null} className="border border-fn-red/50 px-3 py-2 text-xs font-black uppercase text-fn-red disabled:opacity-50">Reject</button>
                {row.highlight_requested && !row.highlight_granted && <button onClick={() => review(row.id, 'grant_highlight')} disabled={acting !== null} className="border border-fn-yellow/60 bg-fn-yellow/10 px-3 py-2 text-xs font-black uppercase text-fn-yellow disabled:opacity-50">{acting === `${row.id}:grant_highlight` ? 'Granting…' : 'Grant Highlight'}</button>}
                {row.highlight_granted && <button onClick={() => review(row.id, 'revoke_highlight')} disabled={acting !== null} className="border border-fn-muted px-3 py-2 text-xs font-black uppercase text-fn-muted disabled:opacity-50">{acting === `${row.id}:revoke_highlight` ? 'Revoking…' : 'Revoke Highlight'}</button>}
              </div>
            </article>
          );
        })}
        {!rows.length && <p className="border border-fn-gborder p-6 text-sm text-fn-muted">No marketplace listings are waiting for review.</p>}
      </div>
    </div>
  );
}
