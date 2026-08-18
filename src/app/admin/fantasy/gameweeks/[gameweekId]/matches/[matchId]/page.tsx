'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';

type Row = { id: string; athleteId: string; athleteName: string; participated: boolean; kills: string; topThree: boolean; matchWin: boolean; mvp: boolean; points?: number };
type AthleteOption = { id: string; name?: string; ign?: string; known_name?: string | null; team?: string | null };
const scoring = { participation: 1, kill: 2, topThree: 5, win: 10, mvp: 5 };
function athleteLabel(athlete: AthleteOption) { return athlete.known_name || athlete.ign || athlete.name || 'Unknown athlete'; }
function calc(row: Row) { return (row.participated ? scoring.participation : 0) + (Number(row.kills) || 0) * scoring.kill + (row.matchWin ? scoring.win : row.topThree ? scoring.topThree : 0) + (row.mvp ? scoring.mvp : 0); }

export default function AdminFantasyMatchStatsPage({ params }: { params: { gameweekId: string; matchId: string } }) {
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [savedAt, setSavedAt] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/athletes?game_slug=pubg-mobile&is_icon=false', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        const realAthletes = Array.isArray(data) ? data : [];
        setAthletes(realAthletes);
        setRows((current) => current.length ? current : realAthletes.slice(0, 3).map((athlete: AthleteOption) => ({ id: athlete.id, athleteId: athlete.id, athleteName: athleteLabel(athlete), participated: true, kills: '', topThree: false, matchWin: false, mvp: false })));
      })
      .catch(() => setError('Unable to load the real PUBG Mobile athlete roster.'));
  }, []);
  const mvpCount = rows.filter((r) => r.mvp).length;
  const incomplete = useMemo(() => rows.filter((r) => r.kills === '' || Number(r.kills) < 0 || !Number.isFinite(Number(r.kills))).map((r) => r.id), [rows]);
  function patch(id: string, changes: Partial<Row>) { setRows((current) => current.map((row) => row.id === id ? { ...row, ...changes } : row)); }
  function addAthlete(id: string) { const athlete = athletes.find((a) => a.id === id); if (!athlete || rows.some((row) => row.athleteId === id)) return; setRows((current) => [...current, { id, athleteId: id, athleteName: athleteLabel(athlete), participated: true, kills: '', topThree: false, matchWin: false, mvp: false }]); }
  async function save(finalize = false) {
    if (incomplete.length) { setError('Enter an explicit kill count for every listed athlete. Use 0 when the player had no kills.'); return; }
    if (mvpCount > 1) { setError('Only one athlete can be MVP for this match. Uncheck the extra MVP rows before saving.'); return; }
    const calculated = rows.map((row) => ({ ...row, points: calc(row) }));
    setRows(calculated); setSavedAt(new Date().toISOString()); setError('');
    await fetch(`/api/admin/fantasy/matches/${params.matchId}/stats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: calculated.map((row) => ({ athlete_id: row.athleteId, participated: row.participated, kills: Number(row.kills), top_three_finish: row.topThree, match_win: row.matchWin, mvp: row.mvp })), finalize }) }).catch(() => null);
  }
  return <div className="p-8"><div className="mb-5 text-xs uppercase tracking-widest text-fn-muted"><Link className="text-fn-green" href="/admin/fantasy">Fantasy League</Link> / <Link className="text-fn-green" href={`/admin/fantasy/gameweeks/${params.gameweekId}`}>Gameweek</Link> / Matches / Stat Entry</div><h1 className="font-display text-2xl font-black uppercase text-fn-text">Match stat entry grid</h1><p className="mt-2 max-w-3xl text-sm text-fn-muted">Manual PUBG Mobile roster stats are saved per match, calculated immediately from the current scoring config, and then rolled up to Gameweek squads, total points, and leaderboard views. The schema keeps game_slug on matches so CODM, Free Fire, and MLBB can add their own stat fields later without rebuilding the navigation.</p>{savedAt && <p className="mt-3 inline-flex border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">Stats entered. Last edited: {new Date(savedAt).toLocaleString()}</p>}{error && <p className="mt-3 flex items-center gap-2 border border-fn-red/40 bg-fn-red/10 px-3 py-2 text-xs text-fn-red"><AlertTriangle size={14} /> {error}</p>}<div className="mt-5 overflow-x-auto border border-fn-gborder"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-fn-dark uppercase tracking-widest text-fn-muted"><tr><th className="p-3">Athlete</th><th>Participated</th><th>Kills</th><th>Top 3</th><th>Match Win</th><th>MVP</th><th>Calculated points</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={`border-t border-fn-gborder ${incomplete.includes(row.id) ? 'bg-fn-red/5' : 'bg-fn-card'}`}><td className="p-3 font-black text-fn-text">{row.athleteName}</td><td><input type="checkbox" checked={row.participated} onChange={(e) => patch(row.id, { participated: e.target.checked })} /></td><td><input className="w-24 border border-fn-gborder bg-fn-black px-2 py-2 text-fn-text" type="number" min="0" value={row.kills} onChange={(e) => patch(row.id, { kills: e.target.value })} placeholder="required" /></td><td><input type="checkbox" checked={row.topThree} onChange={(e) => patch(row.id, { topThree: e.target.checked })} /></td><td><input type="checkbox" checked={row.matchWin} onChange={(e) => patch(row.id, { matchWin: e.target.checked })} /></td><td><input type="checkbox" checked={row.mvp} onChange={(e) => patch(row.id, { mvp: e.target.checked })} /></td><td className="font-black text-fn-green">{row.points ?? '—'}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-3"><select onChange={(e) => addAthlete(e.target.value)} defaultValue="" className="border border-fn-gborder bg-fn-black px-3 py-3 text-xs text-fn-text"><option value="" disabled>Add athlete to roster</option>{athletes.map((a) => <option key={a.id} value={a.id}>{athleteLabel(a)}{a.team ? ` — ${a.team}` : ''}</option>)}</select><button onClick={() => save(false)} className="inline-flex items-center gap-2 bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black"><Save size={14} /> Save & Calculate Points</button><button onClick={() => save(true)} className="inline-flex items-center gap-2 border border-fn-green/40 px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-green"><Save size={14} /> Finalize & Alert</button></div></div>;
}
