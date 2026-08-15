'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Trophy } from 'lucide-react';
import BrandedLoader from '@/components/common/BrandedLoader';

type Org = { id: string; name: string; logo_url: string | null; region: string | null; founded_year: number | null; achievements?: unknown[] };

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8 lg:p-12">
      <div className="mb-8">
        <p className="fn-label mb-2 flex items-center gap-2"><Building2 size={12} className="text-fn-green" /> CLUB COMMAND</p>
        <h1 className="font-display text-4xl font-black uppercase text-fn-text">Esports Organizations</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">Organizations sit above teams and can field rosters across multiple games.</p>
      </div>

      {loading ? <div className="mt-8 flex justify-center"><BrandedLoader label="Loading organizations" /></div> : orgs.length === 0 ? <p className="text-xs text-fn-muted">No organizations have been added yet.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orgs.map((org) => (
            <Link key={org.id} href={`/organizations/${org.id}`} className="group rounded-sm border border-fn-gborder bg-fn-card p-5 transition-all hover:border-fn-green/40 hover:bg-fn-card2">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-dark">
                  {org.logo_url ? <img src={org.logo_url} alt={org.name} className="h-full w-full object-cover" /> : <Building2 className="text-fn-green" />}
                </div>
                <div>
                  <h2 className="font-display text-xl font-black uppercase text-fn-text group-hover:text-fn-green">{org.name}</h2>
                  <p className="fn-label mt-1 flex items-center gap-1"><MapPin size={9} /> {org.region || 'Global'} · {org.founded_year || 'Founded TBA'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fn-muted"><Trophy size={11} className="text-fn-yellow" /> {(org.achievements?.length ?? 0).toLocaleString()} titles / achievements</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
