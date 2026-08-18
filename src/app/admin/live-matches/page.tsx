'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Save } from 'lucide-react';

type Tournament = { id: string; name: string; game_slug: string };
type LiveEvent = { round?: number | null; stat_type?: string; actor?: string; timestamp?: string };
type Match = { id: string; tournament_id: string; title: string; team_a?: string | null; team_b?: string | null; starts_at?: string | null; display_status?: string; live_state?: Record<string, string>; live_events?: LiveEvent[]; tournament?: Tournament };

export default function AdminLiveMatchesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentId, setTournamentId] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ score_a: '', score_b: '', current_round: '', current_map: '', elapsed: '', live_notes: '', status: 'live', event_round: '', stat_type: 'update', actor: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const selected = matches.find((match) => match.id === selectedId);

  useEffect(() => { fetch('/api/tournaments').then((r) => r.json()).then((data) => setTournaments(Array.isArray(data) ? data : [])).catch(() => setTournaments([])); }, []);
  useEffect(() => {
    const qs = tournamentId ? `?tournament=${tournamentId}` : '';
    fetch(`/api/admin/tournament-matches${qs}`).then((r) => r.json()).then((data) => setMatches(Array.isArray(data) ? data : [])).catch(() => setMatches([]));
  }, [tournamentId, message]);

  function selectMatch(matchId: string) {
    const next = matches.find((match) => match.id === matchId);
    setSelectedId(matchId);
    setForm({
      score_a: next?.live_state?.score_a || '',
      score_b: next?.live_state?.score_b || '',
      current_round: next?.live_state?.current_round || '',
      current_map: next?.live_state?.current_map || '',
      elapsed: next?.live_state?.elapsed || '',
      live_notes: next?.live_state?.notes || '',
      event_round: next?.live_state?.current_round || '',
      stat_type: 'update',
      actor: '',
      status: next?.display_status === 'upcoming' ? 'live' : next?.display_status || 'live',
    });
  }

  async function sendUpdate() {
    if (!selected) return;
    setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin/match-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournament_match_id: selected.id, preset: notice.preset, title: notice.preset, message: notice.message }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to notify subscribers.');
      setMessage(`Subscriber update sent for ${selected.title}.`);
      setNotice({ preset: 'Lineups Available', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to notify subscribers.');
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setMessage(''); setError('');
    try {
      const res = await fetch('/api/admin/match-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, source_id: selected.id, tournament_id: selected.tournament_id, match_title: selected.title, team_a: selected.team_a, team_b: selected.team_b, starts_at: selected.starts_at }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update live match.');
      setMessage(`Live state updated for ${selected.title}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update live match.');
    }
  }

  return <div className="p-8 max-w-5xl"><p className="fn-label text-fn-green">Gaming Alerts live touchpoint</p><h1 className="mt-1 font-display text-2xl font-black uppercase tracking-widest text-fn-text">Update Live Score</h1><p className="mt-2 max-w-3xl text-sm text-fn-muted">Fast live updates keep the flat scoreboard snapshot current and append one lightweight event to the match timeline.</p><form onSubmit={submit} className="mt-6 grid gap-4 border border-fn-gborder bg-fn-card p-5 sm:grid-cols-3"><label className="block"><span className="fn-label">Tournament filter</span><select value={tournamentId} onChange={(e) => { setTournamentId(e.target.value); setSelectedId(''); }} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">All tournaments</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.game_slug}</option>)}</select></label><label className="block sm:col-span-2"><span className="fn-label">Existing match</span><select required value={selectedId} onChange={(e) => selectMatch(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">Select fixture</option>{matches.map((m) => <option key={m.id} value={m.id}>{m.title} · {(m.display_status || 'upcoming').toUpperCase()}</option>)}</select></label>{['score_a','score_b','current_round','current_map','elapsed','live_notes'].map((key) => <label key={key} className="block"><span className="fn-label">{key.replaceAll('_', ' ')}</span><input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>)}<label className="block"><span className="fn-label">Event round</span><input value={form.event_round} onChange={(e) => setForm({ ...form, event_round: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label><label className="block"><span className="fn-label">Event type</span><select value={form.stat_type} onChange={(e) => setForm({ ...form, stat_type: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="update">Update</option><option value="kill">Kill</option><option value="goal">Goal</option><option value="point">Point</option></select></label><label className="block"><span className="fn-label">Actor / team / player</span><input value={form.actor} onChange={(e) => setForm({ ...form, actor: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label><label className="block"><span className="fn-label">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="live">Live</option><option value="upcoming">Upcoming</option></select></label><button disabled={!selected} className="inline-flex items-center justify-center gap-2 bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60 sm:col-span-3"><Save size={14} /> Save snapshot + append event</button></form>{selected?.live_events?.length ? <section className="mt-4 border border-fn-gborder bg-fn-card p-4"><p className="fn-label text-fn-green">Recent event log</p><ol className="mt-3 space-y-2 text-xs text-fn-muted">{selected.live_events.slice(-5).map((event, index) => <li key={`${event.timestamp}-${index}`} className="border border-fn-gborder bg-fn-black px-3 py-2">R{event.round || '—'} · {event.stat_type || 'update'} · {event.actor || 'Admin'} · {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</li>)}</ol></section> : null}{message && <p className="mt-4 inline-flex items-center gap-2 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green"><Activity size={13} /> {message}</p>}{error && <p className="mt-4 inline-flex items-center gap-2 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red"><AlertTriangle size={13} /> {error}</p>}</div>;
}
