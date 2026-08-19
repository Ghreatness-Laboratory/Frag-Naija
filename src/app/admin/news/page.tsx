'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Upload } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { title: '', excerpt: '', content: '', image_url: '', author: '', published_at: '', published: false, pinned: false, like_count: 0, view_count: 0 };

type FormState = typeof EMPTY;

type Row = Record<string, unknown> & { id?: string };

export default function AdminNewsPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm]       = useState<FormState>({ ...EMPTY });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/news?all=1', { credentials: 'include' });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setImageFile(null);
    setForm({ ...EMPTY, published_at: new Date().toISOString().slice(0, 16) });
    setError('');
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setImageFile(null);
    setForm({
      title:        String(row.title        ?? ''),
      excerpt:      String(row.excerpt      ?? ''),
      content:      String(row.content      ?? ''),
      image_url:    String(row.image_url    ?? ''),
      author:       String(row.author       ?? ''),
      published_at: row.published_at ? new Date(String(row.published_at)).toISOString().slice(0, 16) : '',
      published:    Boolean(row.published),
      pinned:       Boolean(row.pinned),
      like_count:   Number(row.like_count   ?? 0),
      view_count:   Number(row.view_count   ?? 0),
    });
    setError('');
    setOpen(true);
  }

  async function uploadImage() {
    if (!imageFile) return null;
    const fd = new FormData();
    fd.append('file', imageFile);
    fd.append('bucket', 'news');
    const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return String(data.url || '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const uploadedUrl = await uploadImage();
      const payload = { ...form, image_url: uploadedUrl || form.image_url, published_at: form.published_at ? new Date(form.published_at).toISOString() : null };
      const url = editing ? `/api/news/${editing.id}` : '/api/news';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setOpen(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Row) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    await fetch(`/api/news/${row.id}`, { method: 'DELETE', credentials: 'include' });
    load();
  }

  const f = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target instanceof HTMLInputElement && e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [k]: value }));
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-fn-text">News</h1>
          <p className="mt-0.5 text-xs text-fn-muted">{rows.length} article{rows.length !== 1 ? 's' : ''}. Admin count edits are saved as offsets, so organic likes/views keep adding on top.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded bg-fn-green px-4 py-2 text-sm font-bold uppercase tracking-widest text-fn-black hover:bg-fn-gdim"><Plus className="h-4 w-4" /> Add Article</button>
      </div>

      <AdminTable loading={loading} rows={rows} onEdit={openEdit} onDelete={handleDelete} emptyText="No articles yet - click Add Article" columns={[
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'like_count', label: 'Likes' },
        { key: 'view_count', label: 'Views' },
        { key: 'comment_count', label: 'Comments' },
        { key: 'published', label: 'Status', render: (r) => <span className={`rounded-full px-2 py-0.5 text-xs ${r.published ? 'bg-fn-green/10 text-fn-green' : 'bg-fn-muted/10 text-fn-muted'}`}>{r.published ? 'Published' : 'Draft'}</span> },
      ]} />

      <AdminModal title={editing ? 'Edit Article' : 'New Article'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Headline" required><Input value={form.title} onChange={f('title')} placeholder="Article headline" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author"><Input value={form.author} onChange={f('author')} placeholder="Author name" /></Field>
            <Field label="Publish Date"><Input type="datetime-local" value={form.published_at} onChange={f('published_at')} /></Field>
          </div>
          <Field label="Featured Image Upload"><Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /><p className="mt-1 text-[10px] uppercase tracking-widest text-fn-muted"><Upload size={10} className="mr-1 inline" />Upload takes priority over the URL field.</p></Field>
          <Field label="Featured Image URL"><Input value={form.image_url} onChange={f('image_url')} placeholder="https://..." /></Field>
          <Field label="Short Excerpt"><Textarea value={form.excerpt} onChange={f('excerpt')} placeholder="Magazine teaser shown on the landing page" /></Field>
          <Field label="Body Content" required><Textarea value={form.content} onChange={f('content')} placeholder="Article body. Markdown-style spacing is preserved." required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Displayed Likes"><Input type="number" min="0" value={form.like_count} onChange={f('like_count')} /></Field>
            <Field label="Displayed Views"><Input type="number" min="0" value={form.view_count} onChange={f('view_count')} /></Field>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-fn-muted">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))} className="h-4 w-4 accent-fn-green" /> Published</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))} className="h-4 w-4 accent-fn-green" /> Pin as lead story</label>
          </div>
          {error && <p className="rounded border border-fn-red/20 bg-fn-red/10 px-3 py-2 text-xs text-fn-red">{error}</p>}
          <SubmitBtn loading={saving} label={editing ? 'Update Article' : 'Publish Article'} />
        </form>
      </AdminModal>
    </div>
  );
}
