'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import { Field, Input, Textarea, SubmitBtn } from '@/components/admin/Field';

const EMPTY = { title: '', content: '', image_url: '', author: '', published: false };

type FormState = typeof EMPTY;

export default function AdminNewsPage() {
  const [rows, setRows]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm]       = useState<FormState>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/news?all=1');
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError('');
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      title:     String(row.title     ?? ''),
      content:   String(row.content   ?? ''),
      image_url: String(row.image_url ?? ''),
      author:    String(row.author    ?? ''),
      published: Boolean(row.published),
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/news/${editing.id}` : '/api/news';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOpen(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    await fetch(`/api/news/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: Exclude<keyof FormState, 'published'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">News</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {rows.length} article{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-fn-green text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-fn-gdim transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Article
        </button>
      </div>

      <AdminTable
        loading={loading}
        rows={rows}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No articles yet — click Add Article"
        columns={[
          { key: 'title',  label: 'Title' },
          { key: 'author', label: 'Author' },
          {
            key: 'published',
            label: 'Status',
            render: (r) => (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.published
                    ? 'bg-fn-green/10 text-fn-green'
                    : 'bg-fn-muted/10 text-fn-muted'
                }`}
              >
                {r.published ? 'Published' : 'Draft'}
              </span>
            ),
          },
          {
            key: 'created_at',
            label: 'Date',
            render: (r) => {
              const d = new Date(String(r.created_at));
              return isNaN(d.getTime()) ? String(r.created_at) : d.toLocaleDateString('en-NG');
            },
          },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Article' : 'New Article'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Title" required>
            <Input value={form.title} onChange={f('title')} placeholder="Article headline" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author">
              <Input value={form.author} onChange={f('author')} placeholder="Author name" />
            </Field>
            <Field label="Image URL">
              <Input value={form.image_url} onChange={f('image_url')} placeholder="https://..." />
            </Field>
          </div>
          <Field label="Content" required>
            <Textarea
              value={form.content}
              onChange={f('content')}
              placeholder="Article body..."
              required
            />
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.published}
              onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
              className="w-4 h-4 accent-fn-green"
            />
            <label htmlFor="published" className="text-fn-muted text-xs cursor-pointer">
              Publish immediately
            </label>
          </div>
          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Article' : 'Publish Article'} />
        </form>
      </AdminModal>
    </div>
  );
}
