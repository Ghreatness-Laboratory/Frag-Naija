'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { Field, Input, Select, SubmitBtn } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';

const EMPTY = {
  name: '', game: 'PUBG Mobile', game_slug: 'pubg-mobile', prize_pool: '', currency: 'NGN',
  start_date: '', end_date: '', status: 'Upcoming', format: '', region: 'Nigeria', image_url: '', tier: 'local',
};

const EMPTY_MATCH = { match_title: '', team_a: '', team_b: '', starts_at: '', status: 'upcoming' };

type TournamentMatch = {
  id: string;
  title: string;
  team_a: string | null;
  team_b: string | null;
  starts_at: string | null;
  status: string;
  display_status?: string;
};

function matchStatus(status: string) {
  if (status === 'scheduled') return 'upcoming';
  if (status === 'completed') return 'finished';
  return status;
}

function TournamentsContent() {
  const searchParams = useSearchParams();
  const gameSlug     = searchParams.get('game') ?? 'all';

  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchForm, setMatchForm] = useState({ ...EMPTY_MATCH });
  const [matchSaving, setMatchSaving] = useState(false);
  const [matchError, setMatchError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/tournaments');
    setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadMatches = useCallback(async (tournamentId: string) => {
    setMatchesLoading(true);
    setMatchError('');
    try {
      const res = await fetch(`/api/admin/tournament-matches?tournament=${encodeURIComponent(tournamentId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load tournament matches.');
      setMatches(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setMatches([]);
      setMatchError(e instanceof Error ? e.message : 'Unable to load tournament matches.');
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  // When a game is pre-selected via URL, auto-fill the game dropdown for new entries
  const activeGame = GAMES.find(g => g.slug === gameSlug);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, game: activeGame?.name ?? 'PUBG Mobile', game_slug: activeGame?.slug ?? 'pubg-mobile' });
    setError(''); setMatches([]); setMatchForm({ ...EMPTY_MATCH }); setMatchError(''); setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      name:       String(row.name       ?? ''),
      game:       String(row.game       ?? 'PUBG Mobile'),
      game_slug:  String(row.game_slug  ?? (gameSlug === 'all' ? 'pubg-mobile' : gameSlug)),
      prize_pool: String(row.prize_pool ?? ''),
      currency:   String(row.currency   ?? 'NGN'),
      start_date: String(row.start_date ?? ''),
      end_date:   String(row.end_date   ?? ''),
      status:     String(row.status     ?? 'Upcoming'),
      format:     String(row.format     ?? ''),
      region:     String(row.region     ?? 'Nigeria'),
      image_url:  String(row.image_url  ?? ''),
      tier:       String(row.tier       ?? 'local'),
    });
    setError(''); setMatchForm({ ...EMPTY_MATCH }); setMatchError(''); setOpen(true);
    void loadMatches(String(row.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body   = { ...form, game_slug: form.game_slug || (gameSlug === 'all' ? 'pubg-mobile' : gameSlug), prize_pool: Number(form.prize_pool) || 0 };
      const url    = editing ? `/api/tournaments/${editing.id}` : '/api/tournaments';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text   = await res.text();
      const data   = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(row: Record<string, unknown>, status: string) {
    await fetch(`/api/tournaments/${row.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    await fetch(`/api/tournaments/${row.id}`, { method: 'DELETE' });
    load();
  }

  async function handleMatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.id) return;
    setMatchSaving(true); setMatchError('');
    try {
      const res = await fetch('/api/admin/tournament-matches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: editing.id, ...matchForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save tournament match.');
      setMatchForm({ ...EMPTY_MATCH });
      await loadMatches(String(editing.id));
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : 'Unable to save tournament match.');
    } finally {
      setMatchSaving(false);
    }
  }

  async function handleMatchStatusChange(match: TournamentMatch, status: string) {
    if (!editing?.id) return;
    setMatchSaving(true); setMatchError('');
    try {
      const res = await fetch('/api/admin/tournament-matches', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: editing.id, source_id: match.id, match_title: match.title,
          team_a: match.team_a || '', team_b: match.team_b || '', starts_at: match.starts_at, status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update tournament match status.');
      await loadMatches(String(editing.id));
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : 'Unable to update tournament match status.');
    } finally {
      setMatchSaving(false);
    }
  }

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  // Filter rows by selected game
  const filtered = gameSlug === 'all' ? rows : rows.filter(r => String(r.game_slug ?? '') === gameSlug);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Tournaments</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {gameSlug !== 'all' && activeGame ? ` — ${activeGame.name}` : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors"
          style={activeGame ? { background: activeGame.colors.primary } : {}}
        >
          <Plus className="w-4 h-4" /> Add Tournament
        </button>
      </div>

      <AdminGameFilter currentSlug={gameSlug} />

      <AdminTable
        loading={loading} rows={filtered} onEdit={openEdit} onDelete={handleDelete}
        emptyText="No tournaments for this game yet"
        extraActions={row => (
          <select
            value={String(row.status)}
            onChange={e => handleStatusChange(row, e.target.value)}
            className="text-xs bg-fn-dark border border-fn-gborder rounded px-2 py-1 text-fn-text focus:outline-none focus:border-fn-green"
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        )}
        columns={[
          { key: 'name',       label: 'Name' },
          { key: 'game_slug',  label: 'Game Slug' },
          { key: 'game',       label: 'Game', render: r => {
            const g = GAMES.find(g => g.name === String(r.game));
            return (
              <span className="flex items-center gap-1.5 text-[10px] font-bold">
                {g && <span className="w-2 h-2 rounded-full inline-block" style={{ background: g.colors.primary }} />}
                {String(r.game ?? '—')}
              </span>
            );
          }},
          { key: 'prize_pool', label: 'Prize',  render: r => `₦${Number(r.prize_pool || 0).toLocaleString()}` },
          { key: 'tier', label: 'Tier' },
          { key: 'start_date', label: 'Start' },
          { key: 'status',     label: 'Status', render: r => {
            const c = r.status === 'Live' ? 'bg-fn-green/10 text-fn-green' : r.status === 'Upcoming' ? 'bg-fn-yellow/10 text-fn-yellow' : 'bg-fn-muted/10 text-fn-muted';
            return <span className={`text-xs px-2 py-0.5 rounded-full ${c}`}>{String(r.status)}</span>;
          }},
          { key: 'region', label: 'Region' },
        ]}
      />

      <AdminModal title={editing ? 'Edit Tournament' : 'Add Tournament'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Tournament Name" required>
            <Input value={form.name} onChange={f('name')} placeholder="e.g. Naija Pro League S2" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Game" required>
              <Select
                value={form.game_slug}
                onChange={(event) => {
                  const next = GAMES.find((game) => game.slug === event.target.value);
                  setForm((prev) => ({ ...prev, game_slug: event.target.value, game: next?.name ?? prev.game }));
                }}
              >
                {GAMES.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </Select>
            </Field>
            <Field label="Region"><Input value={form.region} onChange={f('region')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prize Pool (₦)"><Input type="number" value={form.prize_pool} onChange={f('prize_pool')} placeholder="500000" /></Field>
            <Field label="Tier"><Select value={form.tier} onChange={f('tier')}><option value="local">Local</option><option value="national">National</option><option value="international">International</option></Select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              <Select value={form.currency} onChange={f('currency')}>
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date"><Input type="date" value={form.start_date} onChange={f('start_date')} /></Field>
            <Field label="End Date"><Input type="date" value={form.end_date} onChange={f('end_date')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format"><Input value={form.format} onChange={f('format')} placeholder="Battle Royale / TDM" /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </Select>
            </Field>
          </div>
          <Field label="Image URL"><Input value={form.image_url} onChange={f('image_url')} placeholder="https://..." /></Field>
          {error && <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Tournament' : 'Add Tournament'} />
        </form>
        {editing && (
          <section className="mt-6 border-t border-fn-gborder pt-5">
            <div className="mb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-fn-text">Tournament Matches</h3>
              <p className="mt-1 text-xs text-fn-muted">Create an upcoming or live match for this tournament, then update its status as it progresses.</p>
            </div>
            <form onSubmit={handleMatchSubmit} className="space-y-3 rounded border border-fn-gborder bg-fn-dark/40 p-3">
              <Field label="Match Title" required><Input value={matchForm.match_title} onChange={e => setMatchForm(p => ({ ...p, match_title: e.target.value }))} placeholder="e.g. Semi-final 1" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Team A"><Input value={matchForm.team_a} onChange={e => setMatchForm(p => ({ ...p, team_a: e.target.value }))} placeholder="Team A" /></Field>
                <Field label="Team B"><Input value={matchForm.team_b} onChange={e => setMatchForm(p => ({ ...p, team_b: e.target.value }))} placeholder="Team B" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date / Time"><Input type="datetime-local" value={matchForm.starts_at} onChange={e => setMatchForm(p => ({ ...p, starts_at: e.target.value }))} /></Field>
                <Field label="Status"><Select value={matchForm.status} onChange={e => setMatchForm(p => ({ ...p, status: e.target.value }))}><option value="upcoming">Upcoming</option><option value="live">Live</option></Select></Field>
              </div>
              <button type="submit" disabled={matchSaving} className="w-full rounded bg-fn-green py-2 text-sm font-bold uppercase tracking-widest text-fn-black transition-colors hover:bg-fn-gdim disabled:opacity-50">{matchSaving ? 'Saving...' : 'Add Match'}</button>
            </form>
            {matchError && <p className="mt-3 rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{matchError}</p>}
            <div className="mt-4 space-y-2">
              {matchesLoading && <p className="text-xs text-fn-muted">Loading matches...</p>}
              {!matchesLoading && !matches.length && <p className="text-xs text-fn-muted">No matches have been created for this tournament.</p>}
              {matches.map(match => (
                <div key={match.id} className="flex flex-col gap-2 rounded border border-fn-gborder bg-fn-card p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fn-text">{match.title}</p>
                    <p className="mt-0.5 text-xs text-fn-muted">{[match.team_a, match.team_b].filter(Boolean).join(' vs ') || 'Teams not set'}{match.starts_at ? ` · ${new Date(match.starts_at).toLocaleString()}` : ''}</p>
                  </div>
                  <Select value={matchStatus(match.status)} disabled={matchSaving} onChange={e => handleMatchStatusChange(match, e.target.value)} className="sm:w-32">
                    <option value="upcoming">Upcoming</option><option value="live">Live</option><option value="finished">Finished</option>
                  </Select>
                </div>
              ))}
            </div>
          </section>
        )}
      </AdminModal>
    </div>
  );
}

export default function AdminTournamentsPage() {
  return <Suspense><TournamentsContent /></Suspense>;
}
