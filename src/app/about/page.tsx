import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';
import { getCompanyProfile } from '@/features/companyProfile.server';
import { listStakeholders } from '@/features/stakeholders.server';
import StakeholderCard, { type Stakeholder } from '@/components/common/StakeholderCard';
import OptimizedImage from '../../components/common/OptimizedImage';

const blocks = [
  ['Mission', 'mission'],
  ['What They Do', 'what_we_do'],
  ['How They Operate', 'operating_model'],
  ['Owned Products', 'owned_products'],
] as const;

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const [profile, stakeholders] = await Promise.all([getCompanyProfile(), listStakeholders() as Promise<Stakeholder[]>]);

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
                {profile.company_logo ? <OptimizedImage src={profile.company_logo} alt={`${profile.company_name} logo`} className="h-full w-full object-cover" /> : <Building2 className="text-fn-green" size={28} />}
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
      <section id="stakeholders" className="border-t border-fn-gborder px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="fn-label mb-2 text-fn-green">Stakeholders</p>
              <h2 className="text-2xl font-black uppercase tracking-widest text-fn-text">Key People Behind FragNaija</h2>
            </div>
          </div>
          {stakeholders.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stakeholders.map((stakeholder) => <StakeholderCard key={stakeholder.id} stakeholder={stakeholder} />)}
            </div>
          ) : (
            <div className="rounded-sm border border-fn-gborder bg-fn-card p-5 text-xs text-fn-muted">No stakeholders have been published yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
