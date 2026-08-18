'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Filter, Search, Trophy } from 'lucide-react';
import { GAMES } from '@/lib/games';

type Alert = { id: string; game_slug: string; match_title: string; winner_name: string; mvp_name: string; placement_3_name?: string | null; placement_4_name?: string | null; finalized_at: string; unread: boolean; subscribed?: boolean; tournament?: { id: string; name: string; status: string; game_slug: string }; source_match?: { id: string; title: string; status: string; starts_at?: string | null } | null; notification?: { id: string; title: string; message: string; url: string } };
type Tournament = { id: string; name: string; game_slug: string; status: string };
type TrackerMatch = { id: string; tournament_id: string; title: string; team_a?: string | null; team_b?: string | null; starts_at?: string | null; status: string; display_status: string; live_state?: Record<string, string>; subscribed?: boolean; tournament?: Tournament; result?: Alert | null };

export default function GamingAlertsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<TrackerMatch[]>([]);
  const [tournament, setTournament] = useState('');
  const [game, setGame] = useState('');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({ match_results_enabled: true, authenticated: false });

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (tournament) qs.set('tournament', tournament);
    if (game) qs.set('game', game);
    if (status) qs.set('status', status);
    const data = await fetch(`/api/notifications?${qs}`, { credentials: 'include' }).then((r) => r.json());
    setTournaments(data.tournaments || []);
    setMatches(data.matches || []);
    const ids = (data.alerts || []).map((a: Alert) => a.notification?.id).filter(Boolean);
    if (ids.length) await fetch('/api/notifications/read', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => null);
  }, [tournament, game, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/notifications/settings', { credentials: 'include' }).then((r) => r.json()).then(setSettings).catch(() => {}); }, []);

  const games = useMemo(() => Array.from(new Set(tournaments.map((t) => t.game_slug).concat(alerts.map((a) => a.game_slug)).filter(Boolean))), [tournaments, alerts]);
  const gameLabel = (slug: string) => GAMES.find((item) => item.slug === slug)?.name || slug;
  const isMatchToggleable = (alert: Alert) => {
    const tournamentStatus = String(alert.tournament?.status || '').toLowerCase();
    const matchStatus = String(alert.source_match?.status || '').toLowerCase();
    const tournamentOpen = tournamentStatus === 'upcoming' || tournamentStatus === 'live';
    const matchOpen = !matchStatus || matchStatus === 'scheduled' || matchStatus === 'upcoming' || matchStatus === 'live';
    return tournamentOpen && matchOpen;
  };
  const query = search.trim().toLowerCase();
  const visibleTournaments = useMemo(() => {
    if (!query) return tournaments;
    return tournaments.filter((item) => `${item.name} ${item.game_slug} ${gameLabel(item.game_slug)}`.toLowerCase().includes(query));
  }, [query, tournaments]);
  const visibleAlerts = useMemo(() => {
    if (!query) return alerts;
    return alerts.filter((alert) => [alert.match_title, alert.tournament?.name, alert.winner_name, alert.mvp_name, alert.game_slug, gameLabel(alert.game_slug)].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [alerts, query]);

  async function toggleMatchResults(enabled: boolean) {
    setSettings((current) => ({ ...current, match_results_enabled: enabled }));
    await fetch('/api/notifications/settings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match_results_enabled: enabled }) }).catch(() => null);
    if (enabled && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  }

  async function toggleMatchSubscription(alert: Alert) {
    if (!settings.authenticated || !isMatchToggleable(alert)) return;
    const next = !alert.subscribed;
    setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, subscribed: next } : item));
    const res = await fetch('/api/notifications/match-subscriptions', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_match_id: match.id, match_result_id: match.result?.id, subscribed: next }),
    }).catch(() => null);
    if (!res?.ok) setMatches((current) => current.map((item) => item.id === match.id ? { ...item, subscribed: !next } : item));
    if (next && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border border-fn-green/30 bg-fn-card p-5">
        <p className="fn-label text-fn-green">FragNaija Gaming Alerts</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-widest text-fn-text">Gaming Alerts</h1>
            <p className="mt-2 text-sm text-fn-muted">Gaming Alerts uses the same tournament records shown across FragNaija, with match results nested under their real tournament.</p>
          </div>
          <label className="flex items-center gap-3 border border-fn-gborder bg-fn-black px-3 py-2 text-xs font-bold uppercase tracking-widest text-fn-text">
            <input type="checkbox" checked={settings.match_results_enabled} onChange={(e) => toggleMatchResults(e.target.checked)} /> Match alerts
          </label>
        </div>
      </header>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2"><Trophy size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">Platform Tournaments</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          {visibleTournaments.slice(0, 6).map((item) => <article key={item.id} className="border border-fn-gborder bg-fn-card p-4"><p className="text-sm font-black uppercase text-fn-text">{item.name}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">{gameLabel(item.game_slug)}</p><span className="mt-3 inline-flex border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[9px] font-black uppercase text-fn-green">{item.status}</span></article>)}
          {!visibleTournaments.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No platform tournaments available yet.</p>}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Bell size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">Match Result Feed</h2></div>
          <div className="flex flex-wrap items-center gap-2 text-xs"><div className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search matches / tournaments" className="w-64 border border-fn-gborder bg-fn-black py-2 pl-8 pr-3 text-fn-text placeholder:text-fn-muted focus:border-fn-green focus:outline-none" /></div><Filter size={13} className="text-fn-muted" /><select value={tournament} onChange={(e) => setTournament(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">All tournaments</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={game} onChange={(e) => setGame(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">ALL GAMES</option>{games.map((g) => <option key={g} value={g}>{gameLabel(g)}</option>)}</select></div>
        </div>
        <div className="space-y-3">
          {visibleAlerts.map((alert) => <article id={`alert-${alert.id}`} key={alert.id} className="border border-fn-gborder bg-fn-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="fn-label text-fn-green">{alert.tournament?.name || alert.game_slug}</p><h3 className="mt-1 text-lg font-black uppercase tracking-widest text-fn-text">{alert.winner_name} won</h3><p className="mt-1 text-sm text-fn-muted">MVP: <span className="font-bold text-fn-green">{alert.mvp_name}</span> · {alert.match_title}</p><dl className="mt-3 grid gap-2 text-xs text-fn-muted sm:grid-cols-4"><div><dt className="fn-label">Result</dt><dd className="font-bold text-fn-text">{alert.winner_name}</dd></div><div><dt className="fn-label">MVP</dt><dd className="font-bold text-fn-text">{alert.mvp_name}</dd></div><div><dt className="fn-label">3rd place</dt><dd className="font-bold text-fn-text">{alert.placement_3_name || '—'}</dd></div><div><dt className="fn-label">4th place</dt><dd className="font-bold text-fn-text">{alert.placement_4_name || '—'}</dd></div></dl></div><div className="flex items-center gap-2"><button type="button" onClick={() => toggleMatchSubscription(alert)} disabled={!settings.authenticated || !isMatchToggleable(alert)} aria-pressed={Boolean(alert.subscribed)} aria-label={!isMatchToggleable(alert) ? `Match alerts are closed for ${alert.match_title}` : alert.subscribed ? `Disable match alerts for ${alert.match_title}` : `Enable match alerts for ${alert.match_title}`} title={!isMatchToggleable(alert) ? 'Match alerts are closed for finished matches' : settings.authenticated ? 'Toggle alerts for this match' : 'Log in to follow this match'} className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border transition-all disabled:cursor-not-allowed ${!isMatchToggleable(alert) ? 'border-fn-gborder/60 bg-fn-dark/60 text-fn-muted/40 opacity-60 grayscale' : alert.subscribed ? 'border-fn-green/60 bg-fn-green/10 text-fn-green shadow-[0_0_18px_rgba(57,255,20,0.18)]' : 'border-fn-gborder bg-fn-black text-fn-muted hover:border-fn-green/40 hover:text-fn-green'}`}><Bell size={16} fill={alert.subscribed ? 'currentColor' : 'none'} /></button><time className="text-[10px] uppercase tracking-widest text-fn-muted">{new Date(alert.finalized_at).toLocaleString()}</time></div></div></article>)}
          {!visibleAlerts.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No match-result alerts match these filters yet.</p>}
        </div>
      </section>
    </div>
  );
}
