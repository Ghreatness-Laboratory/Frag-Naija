'use client';

import OptimizedImage from '../../../components/common/OptimizedImage';
import { useEffect, useState } from 'react';
import { Building2, Plus, Save, Trash2 } from 'lucide-react';
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

type Stakeholder = {
  id?: string;
  name: string;
  role: string;
  photo_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  twitch_url: string;
  website_url: string;
  sort_order: number | string;
  status: string;
};

const EMPTY_STAKEHOLDER: Stakeholder = {
  name: '', role: '', photo_url: '', twitter_url: '', instagram_url: '', linkedin_url: '',
  youtube_url: '', twitch_url: '', website_url: '', sort_order: 0, status: 'Published',
};

export default function AdminCompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [stakeholderForm, setStakeholderForm] = useState<Stakeholder>(EMPTY_STAKEHOLDER);
  const [editingStakeholderId, setEditingStakeholderId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/company-profile', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then((data) => setProfile({ ...EMPTY, ...data }))
      .catch(() => setProfile(EMPTY))
      .finally(() => setLoading(false));
    fetch('/api/stakeholders?admin=1', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStakeholders(Array.isArray(data) ? data : []))
      .catch(() => setStakeholders([]));
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


  const sf = (key: keyof Stakeholder) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setStakeholderForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  function editStakeholder(row: Stakeholder) {
    setEditingStakeholderId(row.id ?? null);
    setStakeholderForm({ ...EMPTY_STAKEHOLDER, ...row });
  }

  async function saveStakeholder(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch('/api/stakeholders', {
      method: editingStakeholderId ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...stakeholderForm, id: editingStakeholderId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Stakeholder save failed'); return; }
    setStakeholders((prev) => editingStakeholderId ? prev.map((row) => row.id === editingStakeholderId ? data : row) : [...prev, data]);
    setEditingStakeholderId(null);
    setStakeholderForm(EMPTY_STAKEHOLDER);
  }

  async function removeStakeholder(id?: string) {
    if (!id) return;
    const res = await fetch(`/api/stakeholders?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { const data = await res.json(); setError(data.error || 'Stakeholder delete failed'); return; }
    setStakeholders((prev) => prev.filter((row) => row.id !== id));
    if (editingStakeholderId === id) { setEditingStakeholderId(null); setStakeholderForm(EMPTY_STAKEHOLDER); }
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
        {profile.company_logo ? <OptimizedImage src={profile.company_logo} alt="" className="h-14 w-14 rounded-sm border border-fn-gborder object-cover" /> : null}
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

      <section className="mt-6 space-y-4 rounded-sm border border-fn-gborder bg-fn-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="fn-label text-fn-green">Stakeholders</p>
            <h2 className="mt-1 text-lg font-black uppercase tracking-widest text-fn-text">Key People</h2>
            <p className="mt-1 text-[10px] text-fn-muted">Add/edit/remove public stakeholder cards with optional photos and flexible social links.</p>
          </div>
          <button type="button" onClick={() => { setEditingStakeholderId(null); setStakeholderForm(EMPTY_STAKEHOLDER); }} className="inline-flex items-center gap-2 rounded-sm border border-fn-green/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-green"><Plus size={12} /> New</button>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {stakeholders.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-sm border border-fn-gborder bg-fn-dark p-3">
              <button type="button" onClick={() => editStakeholder(row)} className="min-w-0 text-left">
                <span className="block truncate text-xs font-black uppercase tracking-widest text-fn-text">{row.name || 'Unnamed'}</span>
                <span className="mt-1 block truncate text-[10px] text-fn-muted">{row.role || 'No role'} · {row.status}</span>
              </button>
              <button type="button" onClick={() => removeStakeholder(row.id)} className="text-fn-muted hover:text-fn-red" aria-label={`Delete ${row.name}`}><Trash2 size={14} /></button>
            </div>
          ))}
          {!stakeholders.length && <p className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-xs text-fn-muted">No stakeholders yet.</p>}
        </div>

        <form onSubmit={saveStakeholder} className="grid gap-3 border-t border-fn-gborder pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name" required><Input value={stakeholderForm.name} onChange={sf('name')} required /></Field>
            <Field label="Role" required><Input value={stakeholderForm.role} onChange={sf('role')} required /></Field>
            <Field label="Photo URL"><Input value={stakeholderForm.photo_url ?? ''} onChange={sf('photo_url')} placeholder="https://..." /></Field>
            <Field label="Sort Order"><Input type="number" value={stakeholderForm.sort_order} onChange={sf('sort_order')} /></Field>
            <Field label="X / Twitter URL"><Input value={stakeholderForm.twitter_url ?? ''} onChange={sf('twitter_url')} /></Field>
            <Field label="Instagram URL"><Input value={stakeholderForm.instagram_url ?? ''} onChange={sf('instagram_url')} /></Field>
            <Field label="LinkedIn URL"><Input value={stakeholderForm.linkedin_url ?? ''} onChange={sf('linkedin_url')} /></Field>
            <Field label="Website URL"><Input value={stakeholderForm.website_url ?? ''} onChange={sf('website_url')} /></Field>
            <Field label="YouTube URL"><Input value={stakeholderForm.youtube_url ?? ''} onChange={sf('youtube_url')} /></Field>
            <Field label="Twitch URL"><Input value={stakeholderForm.twitch_url ?? ''} onChange={sf('twitch_url')} /></Field>
          </div>
          <Field label="Status"><select value={stakeholderForm.status} onChange={sf('status')} className="w-full rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2 text-sm text-fn-text outline-none focus:border-fn-green"><option>Published</option><option>Draft</option></select></Field>
          <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-sm bg-fn-green px-4 py-3 text-xs font-black uppercase tracking-widest text-fn-black">
            <Save size={14} /> {editingStakeholderId ? 'Update Stakeholder' : 'Add Stakeholder'}
          </button>
        </form>
      </section>
    </div>
  );
}
