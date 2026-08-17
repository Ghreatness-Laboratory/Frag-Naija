"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Trophy, Users, Activity } from "lucide-react";

type Player = { id: string; name: string; ign: string; role: string | null; overall_rating: number; photo_url: string | null; status: string };
type Team = { id: string; name: string; logo_url: string | null; region: string | null; wins: number; losses: number; kills: number; bio: string | null; rank: number | null; strength: number | null; achievements: string[] | string | null; players: Player[] };

function asList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  try { return asList(JSON.parse(String(value))); } catch { return String(value).split(",").map((x) => x.trim()).filter(Boolean); }
}

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${params.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setTeam)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen p-8 text-fn-muted">Loading team profile...</div>;
  if (!team) return <div className="min-h-screen p-8"><Link href="/teams" className="text-fn-green">← Back to teams</Link><p className="mt-6 text-fn-muted">Team not found.</p></div>;

  const achievements = asList(team.achievements);
  const total = team.wins + team.losses;
  const winRate = total ? Math.round((team.wins / total) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <Link href="/teams" className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fn-muted hover:text-fn-green"><ArrowLeft size={12} /> Back to teams</Link>
      <section className="rounded-sm border border-fn-gborder bg-fn-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-card2">{team.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Shield className="h-10 w-10 text-fn-green" />}</div>
            <div><p className="fn-label">{team.region || "Nigeria"}</p><h1 className="font-display text-3xl font-black uppercase text-fn-text">{team.name}</h1><p className="text-xs text-fn-muted">Rank #{team.rank ?? "—"} • Power {team.strength ?? 0}</p></div>
          </div>
        </div>
        {team.bio && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-fn-muted">{team.bio}</p>}
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[{ label: "Wins", value: team.wins }, { label: "Losses", value: team.losses }, { label: "Kills", value: team.kills }, { label: "Form", value: `${winRate}%` }].map((s) => <div key={s.label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center"><div className="font-display text-2xl font-black text-fn-green">{s.value}</div><div className="fn-label">{s.label}</div></div>)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-sm border border-fn-gborder bg-fn-card p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-fn-text"><Users size={14} className="text-fn-green" /> Current Roster</h2>{team.players?.length ? <div className="grid gap-3 sm:grid-cols-2">{team.players.map((p) => <Link key={p.id} href={`/athletes/${p.id}`} className="flex items-center gap-3 rounded-sm border border-fn-gborder bg-fn-card2 p-3 hover:border-fn-green/40"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-fn-card">{p.photo_url ? <img src={p.photo_url} alt={p.ign} className="h-full w-full rounded-full object-cover" /> : <span className="text-fn-green">{p.ign[0]}</span>}</div><div><p className="text-xs font-bold text-fn-text">{p.ign}</p><p className="fn-label">{p.role || "Player"} • {p.overall_rating ?? 0} RTG</p></div></Link>)}</div> : <p className="text-xs text-fn-muted">No roster players assigned.</p>}</section>
        <section className="rounded-sm border border-fn-gborder bg-fn-card p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-fn-text"><Trophy size={14} className="text-fn-green" /> Tournament Results</h2>{achievements.length ? <ul className="space-y-2">{achievements.map((x) => <li key={x} className="text-xs text-fn-muted">• {x}</li>)}</ul> : <p className="text-xs text-fn-muted">No past results recorded.</p>}<h3 className="mt-6 mb-2 flex items-center gap-2 text-xs font-bold uppercase text-fn-text"><Activity size={12} className="text-fn-green" /> Performance History</h3><p className="text-xs text-fn-muted">{team.wins}-{team.losses} record with {team.kills} total kills and {winRate}% current form.</p></section>
      </div>
    </div>
  );
}
