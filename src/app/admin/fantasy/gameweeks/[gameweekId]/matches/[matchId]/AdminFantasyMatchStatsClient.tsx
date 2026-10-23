'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Save, Shield } from 'lucide-react';
import { isFootballGame } from '@/lib/game-categories';

type Row = {
  id: string;
  athleteId: string;
  athleteName: string;
  participated: boolean;
  kills: string;
  topThree: boolean;
  matchWin: boolean;
  mvp: boolean;
  goals: string;
  assists: string;
  cleanSheet: boolean;
  result: 'win' | 'loss' | 'draw';
  conceded: string;
  points?: number;
};

type Athlete = { id: string; name?: string; ign?: string; known_name?: string | null };
type Config = Record<string, number>;
type SavedStat = {
  athlete_id: string;
  participated?: boolean;
  kills?: number;
  top_three_finish?: boolean;
  match_win?: boolean;
  mvp?: boolean;
  goals?: number;
  assists?: number;
  clean_sheet?: boolean;
  result?: 'win' | 'loss' | 'draw';
  goals_conceded?: number;
  fantasy_points?: number;
};

const label = (athlete: Athlete) => athlete.known_name || athlete.ign || athlete.name || 'Unknown athlete';

export default function AdminFantasyMatchStatsPage({ params }: { params: { gameweekId: string; matchId: string } }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [gameSlug, setGameSlug] = useState('pubg-mobile');
  const [config, setConfig] = useState<Config>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const football = isFootballGame(gameSlug);

  useEffect(() => {
    fetch(`/api/admin/fantasy/matches/${params.matchId}/stats`, { cache: 'no-store' })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error))))
      .then((data) => {
        setGameSlug(data.match.game_slug);
        setConfig(data.config || {});
        const stats = new Map<string, SavedStat>((data.stats || []).map((stat: SavedStat) => [stat.athlete_id, stat]));
        setRows(
          (data.athletes || []).map((a: Athlete) => {
            const s: Partial<SavedStat> = stats.get(a.id) || {};
            return {
              id: a.id,
              athleteId: a.id,
              athleteName: label(a),
              participated: s.participated ?? true,
              kills: String(s.kills ?? 0),
              topThree: Boolean(s.top_three_finish),
              matchWin: Boolean(s.match_win),
              mvp: Boolean(s.mvp),
              goals: String(s.goals ?? 0),
              assists: String(s.assists ?? 0),
              cleanSheet: Boolean(s.clean_sheet),
              result: s.result || 'draw',
              conceded: String(s.goals_conceded ?? 0),
              points: s.fantasy_points,
            };
          })
        );
      })
      .catch((e) => setError(e.message));
  }, [params.matchId]);

  const calc = (row: Row) => {
    if (football) {
      const appeared = row.participated ? Number(config.appearance_points ?? 1) : 0;
      const goals = Number(row.goals || 0) * Number(config.goal_points ?? 5);
      const assists = Number(row.assists || 0) * 3;
      const res = row.result === 'win' ? Number(config.win_points ?? 3) : row.result === 'loss' ? Number(config.loss_points ?? -1) : 0;
      const clean = row.cleanSheet ? 4 : 0;
      const conceded = Number(row.conceded || 0) * Number(config.conceded_points ?? -1);
      const mvp = row.mvp ? 3 : 0;
      return appeared + goals + assists + res + clean + conceded + mvp;
    }
    return (
      (row.participated ? Number(config.participation_points ?? 1) : 0) +
      Number(row.kills || 0) * Number(config.kill_points ?? 2) +
      (row.matchWin ? Number(config.match_win_points ?? 10) : row.topThree ? Number(config.top_three_finish_points ?? 5) : 0) +
      (row.mvp ? Number(config.mvp_bonus ?? 5) : 0)
    );
  };

  const invalid = useMemo(
    () =>
      rows.some((r) =>
        football
          ? [r.goals, r.assists, r.conceded].some((v) => !Number.isFinite(Number(v)) || Number(v) < 0)
          : [r.kills].some((v) => !Number.isFinite(Number(v)) || Number(v) < 0)
      ),
    [rows, football]
  );

  const patch = (id: string, changes: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  async function save(finalize = false) {
    setError('');
    setSuccess('');
    if (invalid) {
      setError(football ? 'Goals, assists, and goals conceded must be non-negative numbers.' : 'Kills must be a non-negative number.');
      return;
    }
    const calculated = rows.map((row) => ({ ...row, points: calc(row) }));
    setRows(calculated);
    try {
      const response = await fetch(`/api/admin/fantasy/matches/${params.matchId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalize,
          rows: calculated.map((r) => ({
            athlete_id: r.athleteId,
            participated: r.participated,
            kills: Number(r.kills),
            top_three_finish: r.topThree,
            match_win: r.matchWin,
            mvp: r.mvp,
            goals: Number(r.goals),
            assists: Number(r.assists),
            clean_sheet: r.cleanSheet,
            result: r.result,
            goals_conceded: Number(r.conceded),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to save stats.');
      } else {
        setSuccess(finalize ? 'Stats finalized and athlete fantasy totals updated!' : 'Match stats and calculated points saved!');
      }
    } catch {
      setError('Network error saving match stats.');
    }
  }

  return (
    <div className="p-8">
      <div className="mb-5 text-xs uppercase tracking-widest text-fn-muted">
        <Link className="text-fn-green" href="/admin/fantasy">
          Fantasy League
        </Link>{' '}
        / Stat Entry
      </div>
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-fn-green" />
        <div>
          <h1 className="font-display text-2xl font-black uppercase text-fn-text">
            {football ? `${gameSlug.toUpperCase()} Football Stat Entry` : `${gameSlug.toUpperCase()} Match Stat Entry`}
          </h1>
          <p className="mt-1 text-xs text-fn-muted">
            {football
              ? 'Football scoring: Appeared (+1), Goals (+5), Assists (+3), Win (+3), Draw (0), Loss (-1), Clean Sheet (+4), Conceded (-1), MVP (+3).'
              : 'Shooter scoring: Participation (+1), Kills (+2), Top 3 (+5), Win (+10), MVP (+5).'}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 border border-fn-red/40 bg-fn-red/10 p-3 text-xs text-fn-red">
          <AlertTriangle size={14} />
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 flex items-center gap-2 border border-fn-green/40 bg-fn-green/10 p-3 text-xs font-bold text-fn-green">
          <CheckCircle2 size={14} />
          {success}
        </p>
      )}

      <div className="mt-5 overflow-x-auto border border-fn-gborder bg-fn-card">
        <table className="w-full min-w-[850px] text-xs">
          <thead>
            <tr className="bg-fn-dark text-left border-b border-fn-gborder">
              <th className="p-3">Athlete</th>
              <th className="p-3 text-center">Appeared</th>
              {football ? (
                <>
                  <th className="p-3">Goals (+5)</th>
                  <th className="p-3">Assists (+3)</th>
                  <th className="p-3">Result</th>
                  <th className="p-3 text-center">Clean Sheet (+4)</th>
                  <th className="p-3">Conceded (-1)</th>
                  <th className="p-3 text-center">MVP (+3)</th>
                </>
              ) : (
                <>
                  <th className="p-3">Kills (+2)</th>
                  <th className="p-3 text-center">Top 3 (+5)</th>
                  <th className="p-3 text-center">Win (+10)</th>
                  <th className="p-3 text-center">MVP (+5)</th>
                </>
              )}
              <th className="p-3 font-bold text-fn-green">Calculated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-fn-gborder hover:bg-fn-dark/40">
                <td className="p-3 font-black text-fn-text">{row.athleteName}</td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={row.participated}
                    onChange={(e) => patch(row.id, { participated: e.target.checked })}
                    className="accent-fn-green h-4 w-4"
                  />
                </td>
                {football ? (
                  <>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={row.goals}
                        onChange={(e) => patch(row.id, { goals: e.target.value })}
                        className="w-16 border border-fn-gborder bg-fn-black px-2 py-1 text-center font-bold text-fn-text outline-none focus:border-fn-green"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={row.assists}
                        onChange={(e) => patch(row.id, { assists: e.target.value })}
                        className="w-16 border border-fn-gborder bg-fn-black px-2 py-1 text-center font-bold text-fn-text outline-none focus:border-fn-green"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={row.result}
                        onChange={(e) => patch(row.id, { result: e.target.value as Row['result'] })}
                        className="border border-fn-gborder bg-fn-black px-2 py-1 text-xs uppercase text-fn-text outline-none focus:border-fn-green"
                      >
                        <option value="win">Win (+3)</option>
                        <option value="draw">Draw (0)</option>
                        <option value="loss">Loss (-1)</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.cleanSheet}
                        onChange={(e) => patch(row.id, { cleanSheet: e.target.checked })}
                        className="accent-fn-green h-4 w-4"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={row.conceded}
                        onChange={(e) => patch(row.id, { conceded: e.target.value })}
                        className="w-16 border border-fn-gborder bg-fn-black px-2 py-1 text-center font-bold text-fn-text outline-none focus:border-fn-green"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.mvp}
                        onChange={(e) => patch(row.id, { mvp: e.target.checked })}
                        className="accent-fn-green h-4 w-4"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={row.kills}
                        onChange={(e) => patch(row.id, { kills: e.target.value })}
                        className="w-16 border border-fn-gborder bg-fn-black px-2 py-1 text-center font-bold text-fn-text outline-none focus:border-fn-green"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.topThree}
                        onChange={(e) => patch(row.id, { topThree: e.target.checked })}
                        className="accent-fn-green h-4 w-4"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.matchWin}
                        onChange={(e) => patch(row.id, { matchWin: e.target.checked })}
                        className="accent-fn-green h-4 w-4"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.mvp}
                        onChange={(e) => patch(row.id, { mvp: e.target.checked })}
                        className="accent-fn-green h-4 w-4"
                      />
                    </td>
                  </>
                )}
                <td className="p-3 font-black text-fn-green text-sm">{row.points ?? calc(row)} PTS</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(false)}
          className="flex items-center gap-2 bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-wider text-fn-black hover:bg-fn-gdim"
        >
          <Save size={14} />
          Save & Calculate Points
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          className="border border-fn-green px-5 py-3 text-xs font-black uppercase tracking-wider text-fn-green hover:bg-fn-green/10"
        >
          Finalize & Sync Standings
        </button>
      </div>
    </div>
  );
}

