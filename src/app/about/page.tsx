/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';
import { getCompanyProfile } from '@/features/companyProfile.server';

const blocks = [
  ['Mission', 'mission'],
  ['What They Do', 'what_we_do'],
  ['How They Operate', 'operating_model'],
  ['Owned Products', 'owned_products'],
] as const;

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const profile = await getCompanyProfile();

  return (
    <main className="min-h-screen bg-fn-black text-fn-text">
      <section className="border-b border-fn-gborder px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="mb-6 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted transition-colors hover:text-fn-green">
            FragNaija <ChevronRight size={11} /> Company
          </Link>
          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
            <div>
              <p className="fn-label mb-3 flex items-center gap-2"><Building2 size={12} className="text-fn-green" /> {profile.eyebrow}</p>
              <h1 className="max-w-4xl text-4xl font-black uppercase leading-none tracking-widest text-fn-text sm:text-6xl">{profile.headline}</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-fn-muted">{profile.intro}</p>
            </div>
            <div className="rounded-sm border border-fn-gborder bg-fn-card p-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-dark">
                {profile.company_logo ? <img src={profile.company_logo} alt={`${profile.company_name} logo`} className="h-full w-full object-cover" /> : <Building2 className="text-fn-green" size={28} />}
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-fn-green">Company</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-fn-text">{profile.company_name}</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {blocks.map(([label, key]) => (
            <article key={key} className="rounded-sm border border-fn-gborder bg-fn-card p-5">
              <div className="mb-4 h-px w-16 bg-fn-green" />
              <h2 className="text-sm font-black uppercase tracking-widest text-fn-text">{label}</h2>
              <p className="mt-3 whitespace-pre-line text-xs leading-6 text-fn-muted">{profile[key]}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
