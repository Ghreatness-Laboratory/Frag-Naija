'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Save, Trophy } from 'lucide-react';

type Tournament = { id: string; name: string; game_slug: string; status?: string };
type TournamentMatch = { id: string; tournament_id: string; title: string; game_slug?: string; status?: string; starts_at?: string | null };

const EMPTY_FORM = { tournament_id: '', source_id: '', game_slug: 'pubg-mobile', match_title: '', winner_name: '', mvp_name: '', placement_3_name: '', placement_4_name: '' };

export default function AdminMatchResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedMatches = useMemo(() => matches.filter((match) => match.tournament_id === form.tournament_id), [matches, form.tournament_id]);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load tournaments.')))
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const qs = form.tournament_id ? `?tournament=${form.tournament_id}` : '';
    fetch(`/api/admin/tournament-matches${qs}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load tournament matches.')))
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
  }, [form.tournament_id]);

  function selectTournament(tournamentId: string) {
    const tournament = tournaments.find((item) => item.id === tournamentId);
    setForm({ ...form, tournament_id: tournamentId, source_id: '', match_title: '', game_slug: tournament?.game_slug || form.game_slug });
  }

  function selectMatch(matchId: string) {
    const match = matches.find((item) => item.id === matchId);
    setForm({ ...form, source_id: matchId, match_title: match?.title || '', game_slug: match?.game_slug || form.game_slug });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/match-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to finalize result.');
      const pushWarning = data.push?.error ? ` Push failed separately: ${data.push.error}` : '';
      setMessage(`Result finalized for ${data.matchResult?.winner_name || form.winner_name}.${pushWarning}`);
      setForm((current) => ({ ...EMPTY_FORM, tournament_id: current.tournament_id, game_slug: current.game_slug }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finalize result.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <p className="fn-label text-fn-green">Tournament-linked match-result finalization</p>
      <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-widest text-fn-text">Tournament / Match Results</h1>
      <p className="mt-2 max-w-3xl text-sm text-fn-muted">Finalize results only for matches attached to tournaments created in the existing Tournament admin. The core result save completes even if push delivery fails; any push failure is reported separately.</p>

      <form onSubmit={submit} className="mt-6 grid gap-4 border border-fn-gborder bg-fn-card p-5 sm:grid-cols-2">
        <label className="block"><span className="fn-label">Tournament</span><select required value={form.tournament_id} onChange={(e) => selectTournament(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">Select existing tournament</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="block"><span className="fn-label">Tournament match</span><select required value={form.source_id} onChange={(e) => selectMatch(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">Select match fixture</option>{selectedMatches.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
        <label className="block"><span className="fn-label">Game slug</span><input required value={form.game_slug} onChange={(e) => setForm({ ...form, game_slug: e.target.value })} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Winner</span><input required value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} placeholder="Tribe Warriors" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">MVP</span><input required value={form.mvp_name} onChange={(e) => setForm({ ...form, mvp_name: e.target.value })} placeholder="PlayerName" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">3rd place</span><input required value={form.placement_3_name} onChange={(e) => setForm({ ...form, placement_3_name: e.target.value })} placeholder="3rd-place team/player" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">4th place</span><input required value={form.placement_4_name} onChange={(e) => setForm({ ...form, placement_4_name: e.target.value })} placeholder="4th-place team/player" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        {!selectedMatches.length && form.tournament_id && <p className="flex items-center gap-2 rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red sm:col-span-2"><AlertTriangle size={13} /> This tournament has no match fixtures yet, so no result can be finalized for it.</p>}
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"><Save size={14} /> {saving ? 'Finalizing result…' : 'Finalize result'}</button>
      </form>
      {message && <p className="mt-4 inline-flex items-center gap-2 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green"><Trophy size={13} /> {message}</p>}
      {error && <p className="mt-4 inline-flex items-center gap-2 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red"><AlertTriangle size={13} /> {error}</p>}
    </div>
  );
}
