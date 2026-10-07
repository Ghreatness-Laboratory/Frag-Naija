'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Select, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { tournament_id: '', team_id: '', placement: 'participated' };
const PLACEMENTS = [
  ['1st', '1st'], ['2nd', '2nd'], ['3rd_4th', '3rd–4th'], ['top_8', 'Top 8'], ['participated', 'Participated'],
];

export default function AdminTournamentResultsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [tournaments, setTournaments] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [resultsRes, tournamentsRes, teamsRes] = await Promise.all([fetch('/api/tournament-results'), fetch('/api/tournaments'), fetch('/api/teams')]);
    if (resultsRes.ok) setRows(await resultsRes.json());
    if (tournamentsRes.ok) setTournaments(await tournamentsRes.json());
    if (teamsRes.ok) setTeams(await teamsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm({ ...EMPTY }); setLastSaved(null); setError(''); setOpen(true); }
  function openEdit(row: Record<string, unknown>) { setEditing(row); setForm({ tournament_id: String(row.tournament_id ?? ''), team_id: String(row.team_id ?? ''), placement: String(row.placement ?? 'participated') }); setLastSaved(null); setError(''); setOpen(true); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setLastSaved(null);
    try {
      const res = await fetch(editing ? `/api/tournament-results/${editing.id}` : '/api/tournament-results', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setLastSaved(data);
      setOpen(false);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function remove(row: Record<string, unknown>) {
    if (!confirm('Delete this tournament result?')) return;
    await fetch(`/api/tournament-results/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLSelectElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return <div className="p-8"><div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Tournament Results</h1><p className="text-xs text-fn-muted">Placements drive dynamic team power ranking points. Points are calculated automatically by the database trigger.</p></div><button onClick={openAdd} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black"><Plus size={14} /> Add Result</button></div>{lastSaved && <p className="mb-3 rounded border border-fn-green/20 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">Saved: {Number(lastSaved.points_earned ?? 0).toFixed(2)} ranking points.</p>}<AdminTable loading={loading} rows={rows} onEdit={openEdit} onDelete={remove} emptyText="No tournament results recorded yet" columns={[{ key: 'tournament', label: 'Tournament', render: (r) => String((r.tournament as { name?: string } | null)?.name ?? '—') }, { key: 'team', label: 'Team', render: (r) => String((r.team as { name?: string } | null)?.name ?? '—') }, { key: 'placement', label: 'Placement' }, { key: 'points_earned', label: 'Points', render: (r) => Number(r.points_earned ?? 0).toFixed(2) }]} /><AdminModal title={editing ? 'Edit Result' : 'Add Result'} open={open} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-3"><Field label="Tournament" required><Select value={form.tournament_id} onChange={f('tournament_id')} required><option value="">Select tournament</option>{tournaments.map((t) => <option key={String(t.id)} value={String(t.id)}>{String(t.name)} · {String(t.tier ?? 'local')} · ₦{Number(t.prize_pool ?? 0).toLocaleString()}</option>)}</Select></Field><Field label="Team" required><Select value={form.team_id} onChange={f('team_id')} required><option value="">Select team</option>{teams.map((team) => <option key={String(team.id)} value={String(team.id)}>{String(team.name)} · {String(team.game_slug ?? 'game')}</option>)}</Select></Field><Field label="Placement" required><Select value={form.placement} onChange={f('placement')}>{PLACEMENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>{error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}<SubmitBtn loading={saving} label={editing ? 'Update Result' : 'Save Result'} /></form></AdminModal></div>;
}
