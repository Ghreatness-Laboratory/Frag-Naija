/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import BrandedLoader from '@/components/common/BrandedLoader';
import { Field, Input, Textarea } from '@/components/admin/Field';

type CompanyProfile = {
  company_name: string;
  company_logo: string;
  eyebrow: string;
  headline: string;
  intro: string;
  mission: string;
  what_we_do: string;
  operating_model: string;
  owned_products: string;
};

const EMPTY: CompanyProfile = {
  company_name: '',
  company_logo: '',
  eyebrow: '',
  headline: '',
  intro: '',
  mission: '',
  what_we_do: '',
  operating_model: '',
  owned_products: '',
};

type Key = keyof CompanyProfile;

export default function AdminCompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/company-profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then((data) => setProfile({ ...EMPTY, ...data }))
      .catch(() => setProfile(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const f = (key: Key) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: event.target.value }));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/company-profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setProfile({ ...EMPTY, ...data });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><BrandedLoader label="Loading company profile" /></div>;

  return (
    <div className="max-w-5xl p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="fn-label mb-2 flex items-center gap-2"><Building2 size={12} className="text-fn-green" /> COMPANY PROFILE</p>
          <h1 className="text-2xl font-black uppercase tracking-widest text-fn-text">Ghreatness Laboratory</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">Edit the public company About page and the lower-homepage powered-by credit. Leave the logo empty to show a text-only credit.</p>
        </div>
        {profile.company_logo ? <img src={profile.company_logo} alt="" className="h-14 w-14 rounded-sm border border-fn-gborder object-cover" /> : null}
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-sm border border-fn-gborder bg-fn-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company Name" required><Input value={profile.company_name} onChange={f('company_name')} required /></Field>
          <Field label="Company Logo URL"><Input value={profile.company_logo ?? ''} onChange={f('company_logo')} placeholder="https://..." /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow"><Input value={profile.eyebrow ?? ''} onChange={f('eyebrow')} /></Field>
          <Field label="Headline"><Input value={profile.headline ?? ''} onChange={f('headline')} /></Field>
        </div>
        <Field label="Intro"><Textarea value={profile.intro ?? ''} onChange={f('intro')} rows={4} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mission"><Textarea value={profile.mission ?? ''} onChange={f('mission')} rows={5} /></Field>
          <Field label="What They Do"><Textarea value={profile.what_we_do ?? ''} onChange={f('what_we_do')} rows={5} /></Field>
          <Field label="How They Operate"><Textarea value={profile.operating_model ?? ''} onChange={f('operating_model')} rows={5} /></Field>
          <Field label="Owned Products"><Textarea value={profile.owned_products ?? ''} onChange={f('owned_products')} rows={5} /></Field>
        </div>
        {error && <p className="rounded-sm border border-fn-red/30 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
        {saved && <p className="rounded-sm border border-fn-green/30 bg-fn-green/10 px-3 py-2 text-xs text-fn-green">Company profile saved.</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black disabled:opacity-60">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Company Profile'}
        </button>
      </form>
    </div>
  );
}
