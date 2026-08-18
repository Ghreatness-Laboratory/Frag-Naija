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
  const [status, setStatus] = useState('');
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

  const games = useMemo(() => Array.from(new Set(tournaments.map((t) => t.game_slug).concat(matches.map((m) => m.tournament?.game_slug || '')).filter(Boolean))), [tournaments, matches]);
  const gameLabel = (slug: string) => GAMES.find((item) => item.slug === slug)?.name || slug;
  const isTrackerMatchToggleable = (match: TrackerMatch) => {
    const tournamentStatus = String(match.tournament?.status || '').toLowerCase();
    const matchStatus = String(match.display_status || match.status || '').toLowerCase();
    return (tournamentStatus === 'upcoming' || tournamentStatus === 'live') && (matchStatus === 'upcoming' || matchStatus === 'live' || matchStatus === 'scheduled');
  };
  const query = search.trim().toLowerCase();
  const visibleTournaments = useMemo(() => {
    if (!query) return tournaments;
    return tournaments.filter((item) => `${item.name} ${item.game_slug} ${gameLabel(item.game_slug)}`.toLowerCase().includes(query));
  }, [query, tournaments]);
  const visibleMatches = useMemo(() => {
    if (!query) return matches;
    return matches.filter((match) => [match.title, match.team_a, match.team_b, match.tournament?.name, match.tournament?.game_slug, gameLabel(match.tournament?.game_slug || '')].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [matches, query]);

  async function toggleMatchResults(enabled: boolean) {
    setSettings((current) => ({ ...current, match_results_enabled: enabled }));
    await fetch('/api/notifications/settings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match_results_enabled: enabled }) }).catch(() => null);
    if (enabled && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
  }


  async function toggleTrackerMatchSubscription(match: TrackerMatch) {
    if (!settings.authenticated || !isTrackerMatchToggleable(match)) return;
    const next = !match.subscribed;
    setMatches((current) => current.map((item) => item.id === match.id ? { ...item, subscribed: next } : item));
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
          <div className="flex flex-wrap items-center gap-2 text-xs"><div className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fn-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search matches / tournaments" className="w-64 border border-fn-gborder bg-fn-black py-2 pl-8 pr-3 text-fn-text placeholder:text-fn-muted focus:border-fn-green focus:outline-none" /></div><Filter size={13} className="text-fn-muted" /><select value={tournament} onChange={(e) => setTournament(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">All tournaments</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={game} onChange={(e) => setGame(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">ALL GAMES</option>{games.map((g) => <option key={g} value={g}>{gameLabel(g)}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-fn-gborder bg-fn-black px-3 py-2 uppercase tracking-widest text-fn-text"><option value="">All status</option><option value="live">Live</option><option value="upcoming">Upcoming</option><option value="finished">Finished</option></select></div>
        </div>
        <div className="space-y-3">
          {visibleMatches.map((match) => {
            const live = match.live_state || {};
            const closed = !isTrackerMatchToggleable(match);
            return <article id={`match-${match.id}`} key={match.id} className="border border-fn-gborder bg-fn-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="fn-label text-fn-green">{match.tournament?.name || 'Tournament'} · {gameLabel(match.tournament?.game_slug || '')}</p><h3 className="mt-1 text-lg font-black uppercase tracking-widest text-fn-text">{match.team_a || 'TBD'} vs {match.team_b || 'TBD'}</h3><p className="mt-1 text-sm text-fn-muted">{match.title}{match.starts_at ? ` · ${new Date(match.starts_at).toLocaleString()}` : ''}</p>{match.display_status === 'live' && <div className="mt-3 grid gap-2 text-xs text-fn-muted sm:grid-cols-4"><span className="border border-fn-red/30 bg-fn-red/10 px-2 py-1 font-black uppercase text-fn-red">LIVE</span><span>Score: <b className="text-fn-text">{live.score_a || '0'} - {live.score_b || '0'}</b></span><span>{live.current_round || live.current_map || 'In progress'}</span><span>{live.elapsed || live.notes || 'Updating live'}</span></div>}{match.result && <p className="mt-3 text-xs text-fn-muted">Winner: <b className="text-fn-green">{match.result.winner_name}</b> · MVP: {match.result.mvp_name}</p>}</div><div className="flex items-center gap-2"><span className={`px-2 py-1 text-[9px] font-black uppercase ${match.display_status === 'live' ? 'bg-fn-red/10 text-fn-red' : match.display_status === 'upcoming' ? 'bg-fn-yellow/10 text-fn-yellow' : 'bg-fn-muted/10 text-fn-muted'}`}>{match.display_status}</span><button type="button" onClick={() => toggleTrackerMatchSubscription(match)} disabled={!settings.authenticated || closed} aria-pressed={Boolean(match.subscribed)} aria-label={closed ? `Match alerts are closed for ${match.title}` : match.subscribed ? `Disable match alerts for ${match.title}` : `Enable match alerts for ${match.title}`} title={closed ? 'Match alerts are closed for finished matches' : settings.authenticated ? 'Toggle alerts for this match' : 'Log in to follow this match'} className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border transition-all disabled:cursor-not-allowed ${closed ? 'border-fn-gborder/60 bg-fn-dark/60 text-fn-muted/40 opacity-60 grayscale' : match.subscribed ? 'border-fn-green/60 bg-fn-green/10 text-fn-green shadow-[0_0_18px_rgba(57,255,20,0.18)]' : 'border-fn-gborder bg-fn-black text-fn-muted hover:border-fn-green/40 hover:text-fn-green'}`}><Bell size={16} fill={match.subscribed ? 'currentColor' : 'none'} /></button></div></div></article>;
          })}
          {!visibleMatches.length && <p className="border border-fn-gborder bg-fn-card p-4 text-xs text-fn-muted">No tournament matches match these filters yet.</p>}
        </div>
      </section>
    </div>
  );
}
