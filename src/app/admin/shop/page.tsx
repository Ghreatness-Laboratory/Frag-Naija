'use client';

import { useEffect, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import AdminModal from '@/components/admin/AdminModal';
import AdminTable from '@/components/admin/AdminTable';
import { Field, Input, Select, SubmitBtn, Textarea } from '@/components/admin/Field';
import { GAMES } from '@/lib/games';

type Row = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image_url: string | null;
  category: string | null;
  status: string | null;
  game_slug?: string | null;
  tutorial_video_url?: string | null;
};

const EMPTY = {
  name: '',
  description: '',
  price: '0',
  currency: 'NGN',
  image_url: '',
  tutorial_video_url: '',
  category: 'Account',
  status: 'Published',
  game_slug: '',
};

export default function AdminShopPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/shop-items?all=1', { cache: 'no-store' });
    setRows(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const f = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  function add() {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setError('');
    setOpen(true);
  }

  function edit(row: Row) {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description ?? '',
      price: String(row.price ?? 0),
      currency: row.currency ?? 'NGN',
      image_url: row.image_url ?? '',
      category: row.category ?? 'Gear',
      status: row.status ?? 'Published',
      game_slug: row.game_slug ?? '',
      tutorial_video_url: row.tutorial_video_url ?? '',
    });
    setImageFile(null);
    setError('');
    setOpen(true);
  }

  async function uploadProductImage(): Promise<string | null> {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append('file', imageFile);
    fd.append('bucket', 'shop-items');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url as string;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const imageUrl = await uploadProductImage();
      const res = await fetch(editing ? `/api/shop-items/${editing.id}` : '/api/shop-items', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image_url: imageUrl ?? form.image_url }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setOpen(false);
      setImageFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Delete shop item "${row.name}"?`)) return;
    await fetch(`/api/shop-items/${row.id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">Shop</h1>
          <p className="text-xs text-fn-muted">Manage game accounts, iMercs, thumb sleeves, headsets, and other gear.</p>
        </div>
        <button onClick={add} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black"><Plus size={14} /> Add Item</button>
      </div>

      <AdminTable loading={loading} rows={rows} onEdit={(row) => edit(row as Row)} onDelete={(row) => remove(row as Row)} emptyText="No shop items yet" columns={[{ key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'game_slug', label: 'Game' }, { key: 'price', label: 'Price', render: (r) => `${String(r.currency ?? 'NGN')} ${Number(r.price ?? 0).toLocaleString()}` }, { key: 'status', label: 'Status' }]} />

      <AdminModal title={editing ? 'Edit Shop Item' : 'Add Shop Item'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name" required><Input value={form.name} onChange={f('name')} required /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Category"><Select value={form.category} onChange={f('category')}><option>Account</option><option>iMercs</option><option>Thumb Sleeves</option><option>Headsets</option><option>Gear</option></Select></Field><Field label="Game"><Select value={form.game_slug} onChange={f('game_slug')}><option value="">All games / Gear</option>{GAMES.map((game) => <option key={game.slug} value={game.slug}>{game.name}</option>)}</Select></Field></div>
          <Field label="Description"><Textarea value={form.description} onChange={f('description')} /></Field>
          <Field label="Product Image">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed border-fn-gborder px-3 py-2 transition-colors hover:border-fn-green/40">
                <Upload className="h-4 w-4 text-fn-muted" />
                <span className="text-xs text-fn-muted">{imageFile ? imageFile.name : 'Upload product image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
              </label>
              <Input value={form.image_url} onChange={f('image_url')} placeholder="Or paste image URL" />
              <p className="text-[10px] leading-relaxed text-fn-muted">Uploads use the existing admin upload API and save to the public shop-items storage bucket.</p>
            </div>
          </Field>
          <Field label="Tutorial Video URL"><Input value={form.tutorial_video_url} onChange={f('tutorial_video_url')} placeholder="https://www.youtube.com/watch?v=..." /></Field>
          <div className="grid grid-cols-3 gap-3"><Field label="Price"><Input type="number" value={form.price} onChange={f('price')} /></Field><Field label="Currency"><Input value={form.currency} onChange={f('currency')} /></Field><Field label="Status"><Select value={form.status} onChange={f('status')}><option>Published</option><option>Draft</option></Select></Field></div>
          {error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Item' : 'Add Item'} />
        </form>
      </AdminModal>
    </div>
  );
}
