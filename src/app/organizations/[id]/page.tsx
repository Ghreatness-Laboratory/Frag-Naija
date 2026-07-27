'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, CalendarDays, MapPin, Shield, Trophy } from 'lucide-react';

type Achievement = { id: string; title: string; date: string | null; game_slug: string | null; description: string | null };
type Team = { id: string; name: string; logo_url: string | null; region: string | null; game_slug: string | null };
type Org = { id: string; name: string; logo_url: string | null; region: string | null; founded_year: number | null; founded_date: string | null; description: string | null; achievements: Achievement[]; teams: Team[] };

export default function OrganizationDetail({ params }: { params: { id: string } }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizations/${params.id}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then(setOrg)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen p-8 text-fn-muted">Loading organization…</div>;
  if (!org) return <div className="min-h-screen p-8"><p className="text-fn-muted">Organization not found.</p><Link href="/organizations" className="text-fn-green">Back to organizations</Link></div>;

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <Link href="/organizations" className="fn-label">← ALL ORGANIZATIONS</Link>
      <section className="mt-4 rounded-sm border border-fn-gborder bg-fn-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-sm border border-fn-green/40 bg-fn-green/10">{org.logo_url ? <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" /> : <Building2 className="text-fn-green" size={44} />}</div>
          <div className="flex-1"><p className="fn-label flex flex-wrap items-center gap-2"><MapPin size={10} /> {org.region || 'Global'} <span>·</span> <CalendarDays size={10} /> {org.founded_date || org.founded_year || 'Founded TBA'}</p><h1 className="font-display text-4xl font-black uppercase text-fn-text">{org.name}</h1>{org.description && <p className="mt-3 max-w-3xl text-xs leading-relaxed text-fn-muted">{org.description}</p>}</div>
        </div>
      </section>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-sm border border-fn-gborder bg-fn-card p-4"><h2 className="fn-label mb-3 flex items-center gap-2"><Trophy size={12} className="text-fn-yellow" /> ACHIEVEMENTS</h2>{org.achievements?.length ? org.achievements.map((a) => <div key={a.id} className="mb-3 border-b border-fn-gborder/60 pb-3 last:border-0"><p className="text-xs font-bold uppercase text-fn-text">{a.title}</p><p className="fn-label mt-1">{a.date || 'Date TBA'}{a.game_slug ? ` · ${a.game_slug}` : ''}</p>{a.description && <p className="mt-1 text-[10px] text-fn-muted">{a.description}</p>}</div>) : <p className="text-xs text-fn-muted">No achievements recorded yet.</p>}</article>
        <article className="rounded-sm border border-fn-gborder bg-fn-card p-4"><h2 className="fn-label mb-3 flex items-center gap-2"><Shield size={12} className="text-fn-green" /> TEAMS UNDER THIS ORG</h2>{org.teams?.length ? org.teams.map((team) => <Link key={team.id} href={`/teams/${team.id}`} className="mb-2 flex items-center gap-3 rounded-sm border border-fn-gborder bg-fn-dark p-3 hover:border-fn-green/40"><span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder">{team.logo_url ? <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" /> : <Shield size={14} />}</span><span><span className="block text-xs font-bold text-fn-text">{team.name}</span><span className="fn-label">{team.region || 'Nigeria'} · {team.game_slug || 'all games'}</span></span></Link>) : <p className="text-xs text-fn-muted">No teams assigned to this organization.</p>}</article>
      </div>
    </div>
  );
}
