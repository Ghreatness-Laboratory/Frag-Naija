'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Save, Trash2, Trophy } from 'lucide-react';

type Tournament = { id: string; name: string; game_slug: string; status?: string };
type TournamentMatch = { id: string; tournament_id: string; title: string; status?: string | null; display_status?: string | null; team_a?: string | null; team_b?: string | null; starts_at?: string | null };

type MatchResult = {
  id: string;
  match_title: string;
  winner_name?: string | null;
  mvp_name?: string | null;
  placement_3_name?: string | null;
  placement_4_name?: string | null;
  finalized_at: string;
  source_id?: string | null;
  tournament?: { id: string; name: string; game_slug: string; status: string } | null;
  source_match?: { id: string; title: string; status: string; starts_at?: string | null } | null;
};

const EMPTY_FORM = { tournament_id: '', source_id: '', match_title: '', team_a: '', team_b: '', starts_at: '', winner_name: '', mvp_name: '', placement_3_name: '', placement_4_name: '' };
const DELETE_CONFIRMATION = 'This will remove the public result and reopen this match for editing. This cannot be undone. Continue?';

function isLiveMatch(match: TournamentMatch) {
  return [match.display_status, match.status].some((status) => String(status || '').toLowerCase() === 'live');
}

export default function AdminMatchResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const selectedTournament = tournaments.find((item) => item.id === form.tournament_id);

  async function loadResults() {
    const res = await fetch('/api/admin/match-results', { cache: 'no-store' });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || 'Unable to load finalized results.');
    setResults(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load tournaments.')))
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message));
    loadResults().catch((err) => setError(err.message));
    fetch('/api/admin/tournament-matches').then((r) => r.ok ? r.json() : Promise.reject(new Error('Unable to load tournament matches.'))).then((data) => setMatches(Array.isArray(data) ? data : [])).catch((err) => setError(err.message));
  }, []);

  function selectTournament(tournamentId: string) {
    setForm({ ...form, tournament_id: tournamentId, source_id: '', match_title: '', team_a: '', team_b: '', starts_at: '' });
  }

  function selectMatch(sourceId: string) {
    const match = matches.find((item) => item.id === sourceId);
    if (!match) return;
    setForm({ ...form, source_id: match.id, tournament_id: match.tournament_id, match_title: match.title, team_a: match.team_a || '', team_b: match.team_b || '', starts_at: match.starts_at || '' });
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
      setMessage(`Result finalized for ${data.matchResult?.match_title || form.match_title || 'selected match'}.${pushWarning}`);
      setForm((current) => ({ ...EMPTY_FORM, tournament_id: current.tournament_id }));
      await loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finalize result.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteResult(result: MatchResult) {
    if (!window.confirm(DELETE_CONFIRMATION)) return;
    setDeletingId(result.id);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/admin/match-results/${result.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to delete match result.');
      setMessage(`Deleted ${result.match_title}; match reopened as ${data.reverted_status || 'live'} and can be finalized again.`);
      await loadResults();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete match result.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl p-8">
      <p className="fn-label text-fn-green">Tournament-linked match-result finalization</p>
      <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-widest text-fn-text">Tournament / Match Results</h1>
      <p className="mt-2 max-w-3xl text-sm text-fn-muted">Finalize results under a real tournament created in the existing Tournament admin. Select an existing live fixture from real Tournament data, then save its result. This never creates a separate Match Alerts fixture.</p>

      <form onSubmit={submit} className="mt-6 grid gap-4 border border-fn-gborder bg-fn-card p-5 sm:grid-cols-2">
        <label className="block"><span className="fn-label">Tournament</span><select required value={form.tournament_id} onChange={(e) => selectTournament(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">Select existing tournament</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.game_slug}</option>)}</select></label>
        <label className="block sm:col-span-2"><span className="fn-label">Live match</span><select required value={form.source_id} onChange={(e) => selectMatch(e.target.value)} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm"><option value="">Select an existing live match</option>{matches.filter((match) => match.tournament_id === form.tournament_id && isLiveMatch(match)).map((match) => <option key={match.id} value={match.id}>{match.title}{match.team_a || match.team_b ? ` · ${[match.team_a, match.team_b].filter(Boolean).join(' vs ')}` : ''}</option>)}</select></label>
        <label className="block"><span className="fn-label">Tournament game</span><input readOnly value={selectedTournament?.game_slug || 'Select a tournament'} className="mt-2 w-full border border-fn-gborder bg-fn-dark px-3 py-3 text-sm text-fn-muted" /></label>
        <label className="block"><span className="fn-label">Match / round label</span><input required readOnly value={form.match_title} placeholder="Grand Final — Match 5" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Match date</span><input readOnly value={form.starts_at ? new Date(form.starts_at).toLocaleString() : ''} className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Participant / Team A</span><input readOnly value={form.team_a} placeholder="Tribe Warriors" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Participant / Team B</span><input readOnly value={form.team_b} placeholder="Lagos Titans" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">Winner (optional)</span><input value={form.winner_name} onChange={(e) => setForm({ ...form, winner_name: e.target.value })} placeholder="Tribe Warriors" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">MVP (optional)</span><input value={form.mvp_name} onChange={(e) => setForm({ ...form, mvp_name: e.target.value })} placeholder="PlayerName" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">2nd place (optional)</span><input value={form.placement_3_name} onChange={(e) => setForm({ ...form, placement_3_name: e.target.value })} placeholder="2nd-place team/player" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <label className="block"><span className="fn-label">3rd place (optional)</span><input value={form.placement_4_name} onChange={(e) => setForm({ ...form, placement_4_name: e.target.value })} placeholder="3rd-place team/player" className="mt-2 w-full border border-fn-gborder bg-fn-black px-3 py-3 text-sm" /></label>
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"><Save size={14} /> {saving ? 'Finalizing result…' : 'Finalize result'}</button>
      </form>

      {message && <p className="mt-4 inline-flex items-center gap-2 border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green"><Trophy size={13} /> {message}</p>}
      {error && <p className="mt-4 inline-flex items-center gap-2 border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red"><AlertTriangle size={13} /> {error}</p>}

      <section className="mt-8 border border-fn-gborder bg-fn-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="fn-label text-fn-green">Finalized feed entries</p>
            <h2 className="font-display text-xl font-black uppercase tracking-widest text-fn-text">Delete / reopen result</h2>
          </div>
          <button type="button" onClick={() => loadResults().catch((err) => setError(err.message))} className="border border-fn-gborder px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-muted hover:border-fn-green hover:text-fn-green">Refresh</button>
        </div>
        {results.length === 0 ? (
          <p className="border border-dashed border-fn-gborder p-4 text-xs text-fn-muted">No finalized match results found.</p>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <article key={result.id} className="flex flex-col gap-3 border border-fn-gborder bg-fn-black p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="fn-label text-fn-green">{result.tournament?.name || result.tournament?.game_slug || 'Tournament result'}</p>
                  <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-fn-text">{result.match_title}</h3>
                  <p className="mt-1 text-xs text-fn-muted">Winner: <span className="text-fn-green">{result.winner_name || 'TBA'}</span>{result.mvp_name ? ` · MVP: ${result.mvp_name}` : ''}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">Match status: {result.source_match?.status || 'completed'} · Finalized {new Date(result.finalized_at).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteResult(result)}
                  disabled={deletingId === result.id}
                  className="inline-flex items-center justify-center gap-2 border border-fn-red/40 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-red hover:bg-fn-red/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={13} /> {deletingId === result.id ? 'Deleting…' : 'Delete'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
