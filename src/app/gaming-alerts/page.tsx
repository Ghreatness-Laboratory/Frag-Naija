'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Filter, Radio, Search, Trophy } from 'lucide-react';
import { GAMES } from '@/lib/games';

type ViewStatus = 'live' | 'upcoming' | 'finished';
type Alert = { id: string; game_slug: string; match_title: string; winner_name: string; mvp_name: string; placement_3_name?: string | null; placement_4_name?: string | null; finalized_at: string; unread: boolean; subscribed?: boolean; tournament?: { id: string; name: string; status: string; game_slug: string; display_status?: string }; source_match?: { id: string; title: string; status: string; starts_at?: string | null } | null; notification?: { id: string; title: string; message: string; url: string } };
type Tournament = { id: string; name: string; game_slug: string; status: string; display_status?: string; subscribed?: boolean; start_date?: string | null; end_date?: string | null };
type LiveEvent = { round?: number | null; stat_type?: string; actor?: string; timestamp?: string };
type TrackerMatch = { id: string; tournament_id: string; game_slug: string; title: string; team_a?: string | null; team_b?: string | null; starts_at?: string | null; status: string; display_status: ViewStatus; live_state?: Record<string, string>; live_events?: LiveEvent[]; subscribed?: boolean; tournament?: Tournament; result?: Alert | null };
type GamingNotification = { id: string; type: string; title: string; message: string; game_slug?: string; tournament?: Tournament; unread?: boolean };

const VIEWS: { key: ViewStatus; label: string; help: string }[] = [
  { key: 'live', label: 'Live', help: 'Tournaments and matches currently in progress.' },
  { key: 'upcoming', label: 'Upcoming', help: 'Created tournaments and fixtures that have not started.' },
  { key: 'finished', label: 'Finished', help: 'Completed tournaments and finalized match results.' },
];

function statusOf(value?: string) {
  const status = String(value || '').toLowerCase();
  if (status === 'completed' || status === 'finished') return 'finished';
  if (status === 'live') return 'live';
  return 'upcoming';
}

export default function GamingAlertsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<TrackerMatch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<GamingNotification[]>([]);
  const [tournament, setTournament] = useState('');
  const [game, setGame] = useState('');
  const [view, setView] = useState<ViewStatus>('live');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({ match_results_enabled: true, authenticated: false });

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (tournament) qs.set('tournament', tournament);
    if (game) qs.set('game', game);
    const data = await fetch(`/api/notifications?${qs}`, { credentials: 'include' }).then((r) => r.json());
    setTournaments(data.tournaments || []);
    setMatches(data.matches || []);
    setAlerts(data.alerts || []);
    setNotifications(data.notifications || []);
    const ids = [...(data.alerts || []).map((a: Alert) => a.notification?.id), ...(data.notifications || []).map((item: GamingNotification) => item.id)].filter(Boolean);
    if (ids.length) await fetch('/api/notifications/read', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => null);
  }, [tournament, game]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { fetch('/api/notifications/settings', { credentials: 'include' }).then((r) => r.json()).then(setSettings).catch(() => {}); }, []);

  const gameLabel = (slug: string) => GAMES.find((item) => item.slug === slug)?.name || slug;
  const games = useMemo(() => Array.from(new Set([...tournaments.map((t) => t.game_slug), ...matches.map((m) => m.game_slug || m.tournament?.game_slug || ''), ...alerts.map((a) => a.game_slug)].filter(Boolean))), [tournaments, matches, alerts]);
  const query = search.trim().toLowerCase();
  const matchesByTournament = useMemo(() => {
    const map = new Map<string, TrackerMatch[]>();
    matches.forEach((match) => map.set(match.tournament_id, [...(map.get(match.tournament_id) || []), match]));
    return map;
  }, [matches]);
  const visibleTournaments = useMemo(() => tournaments.filter((item) => {
    const ownMatches = matchesByTournament.get(item.id) || [];
    const viewStatus = ownMatches.some((match) => match.display_status === 'live')
      ? 'live'
      : ownMatches.length && ownMatches.every((match) => match.display_status === 'finished')
        ? 'finished'
        : statusOf(item.display_status || item.status);
    const text = `${item.name} ${item.game_slug} ${gameLabel(item.game_slug)}`.toLowerCase();
    return viewStatus === view && (!query || text.includes(query));
  }), [query, tournaments, matchesByTournament, view]);
  const visibleMatches = useMemo(() => matches.filter((match) => {
    const text = [match.title, match.team_a, match.team_b, match.tournament?.name, match.game_slug, gameLabel(match.game_slug || match.tournament?.game_slug || '')].filter(Boolean).join(' ').toLowerCase();
    return match.display_status === view && (!query || text.includes(query));
  }), [matches, query, view]);
  const visibleAlerts = useMemo(() => alerts.filter((alert) => {
    const text = [alert.match_title, alert.tournament?.name, alert.winner_name, alert.mvp_name, alert.game_slug, gameLabel(alert.game_slug)].filter(Boolean).join(' ').toLowerCase();
    return view === 'finished' && (!query || text.includes(query));
  }), [alerts, query, view]);
  const visibleNotifications = useMemo(() => notifications.filter((item) => {
    const notificationView = item.type === 'match_live' ? 'live' : item.type === 'match_result' ? 'finished' : statusOf(item.tournament?.display_status || item.tournament?.status);
    const text = [item.title, item.message, item.tournament?.name, item.game_slug, item.type].filter(Boolean).join(' ').toLowerCase();
    return notificationView === view && (!query || text.includes(query));
  }), [notifications, query, view]);

  async function toggleMatchResults(enabled: boolean) {
    setSettings((current) => ({ ...current, match_results_enabled: enabled }));
    await fetch('/api/notifications/settings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match_results_enabled: enabled }) }).catch(() => null);
    if (enabled && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  }

  async function toggleTournamentSubscription(item: Tournament) {
    if (!settings.authenticated) return;
    const next = !item.subscribed;
    setTournaments((current) => current.map((row) => row.id === item.id ? { ...row, subscribed: next } : row));
    const res = await fetch('/api/notifications/tournament-subscriptions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournament_id: item.id, subscribed: next }) }).catch(() => null);
    if (!res?.ok) setTournaments((current) => current.map((row) => row.id === item.id ? { ...row, subscribed: !next } : row));
    if (next && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  }

  const renderTournamentBell = (item: Tournament) => <button type="button" onClick={() => toggleTournamentSubscription(item)} disabled={!settings.authenticated} aria-pressed={Boolean(item.subscribed)} aria-label={item.subscribed ? `Disable tournament alerts for ${item.name}` : `Enable tournament alerts for ${item.name}`} title={settings.authenticated ? 'Toggle alerts for this tournament' : 'Log in to follow this tournament'} className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border transition-all disabled:cursor-not-allowed ${item.subscribed ? 'border-fn-green/60 bg-fn-green/10 text-fn-green shadow-[0_0_18px_rgba(57,255,20,0.18)]' : 'border-fn-gborder bg-fn-black text-fn-muted hover:border-fn-green/40 hover:text-fn-green'}`}><Bell size={16} fill={item.subscribed ? 'currentColor' : 'none'} /></button>;

  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><header className="border border-fn-green/30 bg-fn-card p-5"><p className="fn-label text-fn-green">FragNaija Gaming Alerts</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-black uppercase tracking-widest text-fn-text">Match Results</h1><p className="mt-2 text-sm text-fn-muted">Follow platform tournaments with bell alerts, live updates, and finalized results separated by match state.</p></div><label className="flex items-center gap-3 border border-fn-gborder bg-fn-black px-3 py-2 text-xs font-bold uppercase tracking-widest text-fn-text"><input type="checkbox" checked={settings.match_results_enabled} onChange={(e) => toggleMatchResults(e.target.checked)} /> Match alerts</label></div></header>

    <section className="mt-6 border border-fn-gborder bg-fn-card p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex border border-fn-gborder bg-fn-black p-1 text-[10px] font-black uppercase tracking-widest">{VIEWS.map((item) => <button key={item.key} type="button" onClick={() => setView(item.key)} className={`px-4 py-2 ${view === item.key ? 'bg-fn-green text-fn-black' : 'text-fn-muted hover:text-fn-green'}`}>{item.label}</button>)}</div><div className="flex flex-wrap items-center gap-2 text-xs"><div className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search matches / tournaments" className="w-64 border border-fn-gborder bg-fn-black py-2 pl-8 pr-3 text-fn-text placeholder:text-fn-muted focus:border-fn-green focus:outline-none" /></div><Filter size={13} className="text-fn-muted" /><select value={tournament} onChange={(e) => setTournament(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">All tournaments</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={game} onChange={(e) => setGame(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">ALL GAMES</option>{games.map((g) => <option key={g} value={g}>{gameLabel(g)}</option>)}</select></div></div><p className="mt-3 text-xs text-fn-muted">{VIEWS.find((item) => item.key === view)?.help}</p></section>

    <section className="mt-6"><div className="mb-3 flex items-center gap-2"><Trophy size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">{view} tournaments</h2></div><div className="grid gap-3 md:grid-cols-3">{visibleTournaments.map((item) => <article key={item.id} className="border border-fn-gborder bg-fn-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black uppercase text-fn-text">{item.name}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted">{gameLabel(item.game_slug)}</p></div>{renderTournamentBell(item)}</div><span className="mt-3 inline-flex border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[9px] font-black uppercase text-fn-green">{view}</span></article>)}{!visibleTournaments.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No {view} tournaments match these filters.</p>}</div></section>

    <section className="mt-8"><div className="mb-3 flex items-center gap-2"><Radio size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">{view} matches</h2></div><div className="space-y-3">{visibleMatches.map((match) => <article key={match.id} className="border border-fn-gborder bg-fn-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="fn-label text-fn-green">{match.tournament?.name || gameLabel(match.game_slug || '')}</p><h3 className="mt-1 text-base font-black uppercase tracking-widest text-fn-text">{match.title}</h3><p className="mt-1 text-sm text-fn-muted">{[match.team_a, match.team_b].filter(Boolean).join(' vs ') || 'Participants TBA'}</p>{view === 'live' && match.live_state && Object.values(match.live_state).some(Boolean) ? <dl className="mt-3 grid gap-2 text-xs text-fn-muted sm:grid-cols-4"><div><dt className="fn-label">Score</dt><dd className="font-bold text-fn-text">{match.live_state.score_a || '0'} - {match.live_state.score_b || '0'}</dd></div><div><dt className="fn-label">Round</dt><dd className="font-bold text-fn-text">{match.live_state.current_round || '—'}</dd></div><div><dt className="fn-label">Map</dt><dd className="font-bold text-fn-text">{match.live_state.current_map || '—'}</dd></div><div><dt className="fn-label">Progress</dt><dd className="font-bold text-fn-text">{match.live_state.elapsed || '—'}</dd></div></dl> : <p className="mt-2 text-[10px] uppercase tracking-widest text-fn-muted">{match.starts_at ? new Date(match.starts_at).toLocaleString() : 'Schedule TBA'}</p>}{view === 'live' && match.live_events?.length ? <ol className="mt-3 space-y-1 border-t border-fn-gborder pt-3 text-[10px] uppercase tracking-widest text-fn-muted">{match.live_events.slice(-3).map((event, index) => <li key={`${match.id}-${event.timestamp}-${index}`}>R{event.round || '—'} · {event.stat_type || 'update'} · {event.actor || 'Admin'} · {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}</li>)}</ol> : null}</div><span className="inline-flex border border-fn-green/30 bg-fn-green/10 px-2 py-1 text-[9px] font-black uppercase text-fn-green">{match.display_status}</span></div></article>)}{!visibleMatches.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No {view} matches match these filters.</p>}</div></section>

    {view === 'finished' && <section className="mt-8"><div className="mb-3 flex items-center gap-2"><Bell size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">Finalized result feed</h2></div><div className="space-y-3">{visibleAlerts.map((alert) => <article id={`alert-${alert.id}`} key={alert.id} className="border border-fn-gborder bg-fn-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="fn-label text-fn-green">{alert.tournament?.name || alert.game_slug}</p><h3 className="mt-1 text-lg font-black uppercase tracking-widest text-fn-text">{alert.winner_name} won</h3><p className="mt-1 text-sm text-fn-muted">MVP: <span className="font-bold text-fn-green">{alert.mvp_name}</span> · {alert.match_title}</p></div><time className="text-[10px] uppercase tracking-widest text-fn-muted">{new Date(alert.finalized_at).toLocaleString()}</time></div></article>)}{!visibleAlerts.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No finalized results match these filters yet.</p>}</div></section>}

    <section className="mt-8"><div className="mb-3 flex items-center gap-2"><Bell size={16} className="text-fn-green" /><h2 className="font-display text-lg font-black uppercase tracking-widest">{view} alert history</h2></div><div className="space-y-2">{visibleNotifications.map((item) => <article key={item.id} className="border border-fn-gborder bg-fn-card px-4 py-3"><p className="text-xs font-black uppercase text-fn-text">{item.title}</p><p className="mt-1 text-xs text-fn-muted">{item.message}</p></article>)}{!visibleNotifications.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No {view} alert notifications yet.</p>}</div></section>
  </div>;
}
