'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, RotateCcw, Save, ShieldCheck } from 'lucide-react';

const fields = [
  { key: 'appearance_points', label: 'Appearance' },
  { key: 'goal_points', label: 'Goal' },
  { key: 'win_points', label: 'Win' },
  { key: 'loss_points', label: 'Loss' },
  { key: 'conceded_points', label: 'Conceded (per goal)' },
] as const;

const defaults = {
  appearance_points: 1,
  goal_points: 5,
  win_points: 3,
  loss_points: -2,
  conceded_points: -1,
};

export default function FCMobileFantasyScoringPage() {
  const [values, setValues] = useState(defaults);
  const [budget, setBudget] = useState(6000000);
  const [message, setMessage] = useState('');
  const [budgetMessage, setBudgetMessage] = useState('');
  const [repickOpen, setRepickOpen] = useState(true);
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [repickMessage, setRepickMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/fantasy/scoring')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.config) {
          setValues({
            ...defaults,
            ...Object.fromEntries(fields.map(({ key }) => [key, Number(data.config[key])])),
          });
        }
      })
      .catch(() => null);

    fetch('/api/fantasy/settings?game_slug=fc-mobile')
      .then((r) => (r.ok ? r.json() : null))
      .then((settings) => {
        if (settings?.budget) {
          setBudget(Number(settings.budget) || 6000000);
        }
        if (settings?.allow_repick !== undefined) {
          setRepickOpen(Boolean(settings.allow_repick));
        }
        if (settings?.reset_at) {
          setLastResetTime(new Date(settings.reset_at).toLocaleString());
        }
      })
      .catch(() => null);
  }, []);

  async function save() {
    const r = await fetch('/api/admin/fantasy/scoring', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    setMessage(r.ok ? 'FC Mobile scoring configuration saved.' : (await r.json()).error || 'Unable to save configuration.');
  }

  async function saveBudget() {
    const r = await fetch('/api/admin/fantasy/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameSlug: 'fc-mobile', budget }),
    });
    setBudgetMessage(r.ok ? 'FC Mobile squad budget saved.' : (await r.json()).error || 'Unable to save budget.');
    window.setTimeout(() => setBudgetMessage(''), 2500);
  }

  async function handleAllowRepick() {
    if (!window.confirm('Reset all FC Mobile squads and allow everyone to pick again? Previous locked squads will be cleared.')) return;
    setResetBusy(true);
    setRepickMessage('');
    try {
      const res = await fetch('/api/admin/fantasy/fc-mobile/repick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger re-pick reset.');
      setRepickOpen(true);
      setLastResetTime(new Date().toLocaleString());
      setRepickMessage('Success! FC Mobile squads reset. All managers can now pick again.');
    } catch (err: unknown) {
      setRepickMessage(err instanceof Error ? err.message : 'Error triggering re-pick reset.');
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="max-w-4xl p-8">
      <p className="fn-label text-fn-green">Fantasy League / FC Mobile</p>
      <h1 className="mt-2 font-display text-2xl font-black uppercase">FC Mobile Squad & Scoring Rules</h1>
      <p className="mt-2 text-sm text-fn-muted">
        Tactical squad limits and football scoring configurations specific to FC Mobile (game_slug = &apos;fc-mobile&apos;). EA FC 26 and other games are unchanged.
      </p>

      {/* FC Mobile Squad Rules Card */}
      <section className="mt-6 border border-fn-green/30 bg-fn-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="fn-label text-fn-green">Squad Budget & Limits</p>
            <h2 className="font-display text-lg font-black uppercase">Per-Game Squad Constraints</h2>
          </div>
          <ShieldCheck className="text-fn-green" size={24} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="border border-fn-gborder bg-fn-black p-3">
            <span className="fn-label">Squad Budget (NGN)</span>
            <input
              type="number"
              step="100000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-2 w-full border border-fn-gborder bg-fn-dark p-2 text-sm font-bold text-fn-green outline-none"
            />
            <p className="mt-1 text-[10px] text-fn-muted">Default: ₦6,000,000 for FC Mobile (other games: ₦10,000,000)</p>
          </label>
          <div className="border border-fn-gborder bg-fn-black p-3">
            <span className="fn-label">90+ Rating Limit</span>
            <p className="mt-2 text-sm font-black text-fn-yellow">Maximum 2 Players</p>
            <p className="mt-1 text-[10px] text-fn-muted">Enforced both mathematically via player pricing and server-side backstop</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={saveBudget}
            className="bg-fn-green px-4 py-2.5 text-xs font-black uppercase text-fn-black"
          >
            <Save size={14} className="mr-2 inline" /> Save Budget Setting
          </button>
          {budgetMessage && <span className="text-xs font-bold text-fn-green">{budgetMessage}</span>}
        </div>
      </section>

      {/* FC Mobile Squad Re-Pick / Reset Section */}
      <section className="mt-6 border border-fn-yellow/40 bg-fn-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="fn-label text-fn-yellow">FC Mobile Fantasy Re-Pick</p>
            <h2 className="font-display text-lg font-black uppercase">Let Everyone Pick Again</h2>
            <p className="mt-1 text-xs text-fn-muted">
              Opens the squad builder for all FC Mobile managers, resets locked squad states, and enables everyone to pick again with the ₦6,000,000 budget.
            </p>
          </div>
          <RotateCcw className="text-fn-yellow" size={24} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="border border-fn-gborder bg-fn-black p-3">
            <span className="fn-label">Re-Pick Status</span>
            <p className="mt-2 text-sm font-black text-fn-green">
              {repickOpen ? 'ACTIVE / OPEN' : 'LOCKED'}
            </p>
            <p className="mt-1 text-[10px] text-fn-muted">Managers can build or replace squads</p>
          </div>
          <div className="border border-fn-gborder bg-fn-black p-3">
            <span className="fn-label">Transfer Window</span>
            <p className="mt-2 text-sm font-black text-fn-green">OPEN (Full 6 Transfers)</p>
            <p className="mt-1 text-[10px] text-fn-muted">Full squad overhaul allowed</p>
          </div>
          <div className="border border-fn-gborder bg-fn-black p-3">
            <span className="fn-label">Last Reset</span>
            <p className="mt-2 truncate text-xs font-bold text-fn-text">{lastResetTime || 'Active Now'}</p>
            <p className="mt-1 text-[10px] text-fn-muted">Triggered by admin</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAllowRepick}
            disabled={resetBusy}
            className="inline-flex items-center bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black hover:bg-fn-gdim disabled:opacity-50"
          >
            <RefreshCw size={14} className={`mr-2 ${resetBusy ? 'animate-spin' : ''}`} />
            {resetBusy ? 'Resetting Squads...' : 'Allow Everyone to Pick Again (Reset Squads)'}
          </button>
        </div>
        {repickMessage && <p className="mt-3 text-xs font-bold text-fn-green">{repickMessage}</p>}
      </section>

      {/* Scoring Matrix */}
      <section className="mt-6 border border-fn-gborder bg-fn-card p-5">
        <h2 className="font-display text-lg font-black uppercase">Football scoring configuration</h2>
        <p className="mt-1 text-xs text-fn-muted">Draws always score 0 for the result category. Captain scoring remains ×2, and Triple Captain remains ×3, during squad aggregation.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map(({ key, label }) => (
            <label key={key} className="border border-fn-gborder bg-fn-black p-3">
              <span className="fn-label">{label}</span>
              <input
                type="number"
                step="0.01"
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                className="mt-2 w-full border border-fn-gborder bg-fn-dark p-2 text-sm text-fn-text outline-none"
              />
            </label>
          ))}
        </div>
        <button
          onClick={save}
          className="mt-5 bg-fn-green px-4 py-3 text-xs font-black uppercase text-fn-black"
        >
          <Save size={14} className="mr-2 inline" /> Save FC Mobile scoring
        </button>
        {message && <p className="mt-3 text-xs text-fn-green">{message}</p>}
      </section>
    </div>
  );
}
