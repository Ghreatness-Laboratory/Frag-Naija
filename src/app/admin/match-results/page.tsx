'use client';

import { useEffect, useState } from 'react';
import { Save, Trophy } from 'lucide-react';

type Tournament = { id: string; name: string; game_slug: string };

export default function AdminMatchResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [form, setForm] = useState({ source_type: 'tdm_1v1', tournament_id: '', game_slug: 'pubg-mobile', match_title: '', winner_name: '', mvp_name: '' });
  const [message, setMessage] = useState('');

  useEffect(() => { fetch('/api/tournaments').then((r) => r.json()).then((data) => setTournaments(Array.isArray(data) ? data : [])).catch(() => {}); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('Finalizing result...');
    const payload = { ...form, tournament_id: form.tournament_id || null, source_id: crypto.randomUUID() };
    const res = await fetch('/api/admin/match-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setMessage(res.ok ? `Alert generated for ${data.matchResult?.winner_name || form.winner_name}.` : data.error || 'Unable to finalize result.');
    if (res.ok) setForm((current) => ({ ...current, match_title: '', winner_name: '', mvp_name: '' }));
  }

  return (
    <div className="p-8 max-w-4xl">
      <p className="fn-label text-fn-green">General match-result finalization</p>
      <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-widest text-fn-text">Tournament / Match Results</h1>
      <p className="mt-2 max-w-3xl text-sm text-fn-muted">Finalize standalone TDM 1v1, WOW Mode, or other non-Fantasy results with a winner and MVP. Each finalized result feeds the unified Gaming Alerts page, in-app toast pipeline, unread bell badge, and FCM push sender.</p>

      <form onSubmit={submit} className="mt-6 grid gap-4 border border-fn-gborder bg-fn-card p-5 sm:grid-cols-2">
        <label className="block"><span className="fn-label">Match type</span><select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="tdm_1v1">TDM 1v1</option><option value="wow_mode">WOW Mode</option><option value="general">General tournament match</option></select></label>
        <label className="block"><span className="fn-label">Tournament</span><select value={form.tournament_id} onChange={(e) => setForm({ ...form, tournament_id: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">No linked tournament</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="block"><span className="fn-label">Game slug</span><input value={form.game_slug} onChange={(e) => setForm({ ...form, game_slug: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Match title</span><input required value={form.match_title} onChange={(e) => setForm({ ...form, match_title: e.target.value })} placeholder="TDM 1v1 Grand Final" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Winner</span><input required value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} placeholder="Tribe Warriors" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">MVP</span><input required value={form.mvp_name} onChange={(e) => setForm({ ...form, mvp_name: e.target.value })} placeholder="PlayerName" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <button className="inline-flex items-center justify-center gap-2 bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black sm:col-span-2"><Save size={14} /> Finalize & send alert</button>
      </form>
      {message && <p className="mt-4 inline-flex items-center gap-2 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green"><Trophy size={13} /> {message}</p>}
    </div>
  );
}
