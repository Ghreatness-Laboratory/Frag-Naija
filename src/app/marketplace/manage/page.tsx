'use client';

import { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';

const defaults: Record<string, string | boolean> = { display_name: '', ign: '', game_slug: '', photo_url: '', is_free_agent: true, previous_teams: '', gameplay_link: '', device_used: '', availability: '', tournaments_free_for: '', achievements: '', loan_available: false, loan_conditions: '', highlight_requested: false };
const labels: Record<string, string> = { display_name: 'Display name', ign: 'In-game name (IGN)', photo_url: 'Photo URL (optional)', previous_teams: 'Previous teams', gameplay_link: 'Gameplay link', device_used: 'Device used', availability: 'Availability', tournaments_free_for: "Tournaments you're free for", achievements: 'Achievements', loan_conditions: 'Loan reason / conditions' };

export default function ManageMarketplacePage() {
  const { selectedGame } = useGame();
  const [form, setForm] = useState(defaults);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/marketplace/me').then(async (response) => response.ok ? response.json() : Promise.reject(await response.json())).then(({ listing }) => {
      setStatus(listing?.review_status || '');
      setMessage(listing?.reviewer_note || '');
      setForm({ ...defaults, ...(listing?.pending_data || listing?.public_data || {}), game_slug: listing?.pending_data?.game_slug || listing?.public_data?.game_slug || listing?.game_slug || selectedGame?.slug || '', highlight_requested: listing?.highlight_requested ?? listing?.pending_data?.highlight_requested ?? false });
    }).catch((error) => setMessage(error.error || 'Log in to manage a listing.'));
  }, [selectedGame?.slug]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGame) { setMessage('Select a game before submitting your listing.'); return; }
    if (!String(form.display_name).trim() || !String(form.ign).trim()) { setMessage('Display name and in-game name are required.'); return; }

    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/marketplace/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, game_slug: selectedGame.slug }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not submit your listing.');
      setMessage('Listing submitted for review. Your public listing stays unchanged until approval.');
      setStatus('pending');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Could not submit your listing.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="p-4 sm:p-8"><form noValidate onSubmit={save} className="mx-auto max-w-2xl border border-fn-gborder bg-fn-card p-5"><p className="fn-label text-fn-green">Marketplace self-service</p><h1 className="font-display text-3xl font-black uppercase">My Marketplace Listing</h1>{status && <p className="mt-3 border border-fn-green/30 bg-fn-green/10 p-3 text-xs font-bold uppercase text-fn-green">Review status: {status.replace('_', ' ')}</p>}{message && <p className="mt-3 text-xs text-fn-muted">{message}</p>}<div className="mt-5 space-y-4"><p className="rounded border border-fn-gborder bg-fn-black/40 p-3 text-xs text-fn-muted">Game: <strong className="text-fn-text">{selectedGame?.name || 'Select a game to create a listing'}</strong></p>{Object.keys(labels).map((key) => <label key={key} className="block"><span className="fn-label">{labels[key]}</span><textarea required={key === 'display_name' || key === 'ign'} value={String(form[key])} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 min-h-20 w-full border border-fn-gborder bg-fn-black p-3 text-sm" /></label>)}<label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.is_free_agent)} onChange={(event) => setForm({ ...form, is_free_agent: event.target.checked })} /> Currently a free agent</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.loan_available)} onChange={(event) => setForm({ ...form, loan_available: event.target.checked })} /> Available for loan</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(form.highlight_requested)} onChange={(event) => setForm({ ...form, highlight_requested: event.target.checked })} /><span><strong>Highlight my profile</strong><span className="block text-xs text-fn-muted">Request featured placement for this marketplace listing.</span></span></label><button type="submit" className="fn-btn w-full" disabled={saving}>{saving ? 'Submitting…' : 'Submit for review'}</button></div></form></main>;
}
