/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import AdminGameFilter from '@/components/admin/AdminGameFilter';
import { Field, Input, Select, Textarea, SubmitBtn } from '@/components/admin/Field';
import PlayerCardTemplate from '@/components/athletes/PlayerCardTemplate';
import { DEFAULT_GAME, GAMES } from '@/lib/games';
import { isFcMobileGame, isFootballGame, isShooterGame, normalizeRating } from '@/lib/athlete-display';
import { calculateAthleteOverallRating } from '@/lib/athlete-rating';

const EMPTY = {
  name: '', ign: '', team: '', role: '', status: 'Active', bio: '', photo_url: '',
  known_name: '', game_slug: 'pubg-mobile',
  attack: '', defense: '', clutch: '', survival: '', iq: '', aggression: '',
  overall_rating: '', sensitivity_settings: '', control_code: '', perks: '', strengths: '', weaknesses: '',
  previous_aliases: [''],
  previous_teams: [{ team: '', years: '' }],
  achievements: [{ title: '', date: '' }],
  performance_history: [{ label: '', value: '', date: '' }],
};
const FC_MOBILE_GAME = GAMES.find((game) => isFcMobileGame(game.slug));

type AthleteForm = typeof EMPTY;
type TextFormKey = {
  [K in keyof AthleteForm]: AthleteForm[K] extends string ? K : never;
}[keyof AthleteForm];

function toArr(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  return String(val ?? '');
}
function splitArr(str: string): string[] {
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}
function stringList(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((v) => String(v)).filter(Boolean);
  return splitArr(String(val ?? ''));
}
function objectList<T extends Record<string, string>>(val: unknown, fallback: T): T[] {
  const arr = Array.isArray(val) ? val : [];
  const normalized = arr
    .map((item) => ({ ...fallback, ...(typeof item === 'object' && item ? item : {}) }))
    .map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, String(v ?? '')])) as T)
    .filter((item) => Object.values(item).some(Boolean));
  return normalized.length ? normalized : [{ ...fallback }];
}
function cleanStringList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}
function cleanObjectList<T extends Record<string, string>>(items: T[]) {
  return items
    .map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v.trim()])) as T)
    .filter((item) => Object.values(item).some(Boolean));
}

async function prepareAthletePhotoForCard(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;

  try {
    const image = await loadImageFile(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    const total = width * height;
    const background = new Uint8Array(total);
    const queue: number[] = [];

    const enqueue = (index: number) => {
      if (background[index]) return;
      const offset = index * 4;
      if (!isWhiteBackdropPixel(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
      background[index] = 1;
      queue.push(index);
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      if (x > 0) enqueue(index - 1);
      if (x < width - 1) enqueue(index + 1);
      if (y > 0) enqueue(index - width);
      if (y < height - 1) enqueue(index + width);
    }

    if (!queue.length) return file;

    const feather = new Uint8Array(total);
    for (let index = 0; index < total; index += 1) {
      if (background[index]) continue;
      const x = index % width;
      const y = Math.floor(index / width);
      const touchesBackground =
        (x > 0 && background[index - 1]) ||
        (x < width - 1 && background[index + 1]) ||
        (y > 0 && background[index - width]) ||
        (y < height - 1 && background[index + width]);
      if (touchesBackground) feather[index] = 1;
    }

    for (let index = 0; index < total; index += 1) {
      const offset = index * 4;
      if (background[index]) {
        data[offset + 3] = 0;
      } else if (feather[index] && isWhiteBackdropPixel(data[offset], data[offset + 1], data[offset + 2], data[offset + 3], 212)) {
        data[offset + 3] = Math.min(data[offset + 3], 82);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const blob = await canvasToBlob(canvas);
    const filename = file.name.replace(/\.[^.]+$/, '') || 'athlete-photo';
    return new File([blob], `${filename}-card.png`, { type: 'image/png' });
  } catch (error) {
    console.warn('Unable to remove athlete photo backdrop before upload', error);
    return file;
  }
}

function isWhiteBackdropPixel(red: number, green: number, blue: number, alpha: number, threshold = 224) {
  if (alpha < 16) return true;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const brightness = (red + green + blue) / 3;
  return brightness >= threshold && max - min <= 42;
}

function loadImageFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read athlete image'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to prepare athlete image'));
    }, 'image/png');
  });
}

function ListEditor({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(event) => onChange(values.map((item, i) => i === index ? event.target.value : item))}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index).length ? values.filter((_, i) => i !== index) : [''])}
              className="rounded border border-fn-gborder px-3 text-xs font-bold text-fn-muted hover:border-fn-red/40 hover:text-fn-red"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="text-xs font-bold uppercase tracking-widest text-fn-green hover:text-fn-gdim"
        >
          + Add entry
        </button>
      </div>
    </Field>
  );
}

function ObjectListEditor<T extends Record<string, string>>({
  label,
  values,
  emptyItem,
  fields,
  onChange,
}: {
  label: string;
  values: T[];
  emptyItem: T;
  fields: { key: keyof T; label: string; placeholder: string }[];
  onChange: (values: T[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="rounded border border-fn-gborder bg-fn-dark/40 p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fields.map((field) => (
                <Input
                  key={String(field.key)}
                  value={value[field.key]}
                  onChange={(event) => onChange(values.map((item, i) => (
                    i === index ? { ...item, [field.key]: event.target.value } : item
                  )))}
                  placeholder={field.placeholder || field.label}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index).length ? values.filter((_, i) => i !== index) : [{ ...emptyItem }])}
              className="mt-2 text-xs font-bold uppercase tracking-widest text-fn-muted hover:text-fn-red"
            >
              Remove entry
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, { ...emptyItem }])}
          className="text-xs font-bold uppercase tracking-widest text-fn-green hover:text-fn-gdim"
        >
          + Add entry
        </button>
      </div>
    </Field>
  );
}

function AthletesContent() {
  const searchParams = useSearchParams();
  const gameSlug     = searchParams.get('game') ?? 'all';
  const activeGame   = GAMES.find(g => g.slug === gameSlug);

  const [rows, setRows]         = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<Record<string, unknown> | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ar, tr] = await Promise.all([fetch('/api/athletes'), fetch('/api/teams')]);
      const athleteData = ar.ok ? await ar.json() : [];
      const teamData = tr.ok ? await tr.json() : [];
      setRows(Array.isArray(athleteData) ? athleteData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
    } catch (err) {
      console.error('Failed to load admin athlete data', err);
      setRows([]);
      setTeams([]);
      setError('Unable to load athlete data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, game_slug: gameSlug === 'all' ? EMPTY.game_slug : gameSlug });
    setPhotoFile(null);
    setError('');
    setOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row);
    setForm({
      name:           String(row.name   ?? ''),
      ign:            String(row.ign    ?? ''),
      known_name:     String(row.known_name ?? row.ign ?? ''),
      game_slug:      String(row.game_slug ?? (gameSlug === 'all' ? 'pubg-mobile' : gameSlug)),
      team:           String(row.team   ?? ''),
      role:           String(row.role   ?? ''),
      status:         String(row.status ?? 'Active'),
      bio:            String(row.bio    ?? ''),
      photo_url:      String(row.photo_url ?? ''),
      attack:         String(row.attack   ?? '0'),
      defense:        String(row.defense  ?? '0'),
      clutch:         String(row.clutch   ?? '0'),
      survival:       String(row.survival ?? '0'),
      iq:             String(row.iq       ?? '0'),
      aggression:     String(row.aggression ?? '0'),
      overall_rating: String(row.overall_rating ?? ''),
      sensitivity_settings: typeof row.sensitivity_settings === 'string' ? row.sensitivity_settings : JSON.stringify(row.sensitivity_settings ?? {}, null, 2),
      control_code: String(row.control_code ?? ''),
      perks:      toArr(row.perks),
      strengths:  toArr(row.strengths),
      weaknesses: toArr(row.weaknesses),
      previous_aliases: stringList(row.previous_aliases).length ? stringList(row.previous_aliases) : [''],
      previous_teams: objectList(row.previous_teams, { team: '', years: '' }),
      achievements: objectList(row.achievements, { title: '', date: '' }),
      performance_history: objectList(row.performance_history, { label: '', value: '', date: '' }),
    });
    setPhotoFile(null);
    setError('');
    setOpen(true);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const fd = new FormData();
    fd.append('file', photoFile);
    fd.append('bucket', 'athletes');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function handlePhotoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setPhotoFile(null);
      return;
    }

    setError('');
    setPhotoFile(await prepareAthletePhotoForCard(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const photoUrl = await uploadPhoto();
      const fcMobileGame = isFcMobileGame(form.game_slug);
      const shooterGame = isShooterGame(form.game_slug);
      const body = {
        name:           fcMobileGame ? form.ign : form.name,
        ign:            form.ign,
        known_name:     fcMobileGame ? form.ign : (form.known_name || form.ign),
        game_slug:      form.game_slug || (gameSlug === 'all' ? 'pubg-mobile' : gameSlug),
        team:           fcMobileGame ? '' : form.team,
        role:           fcMobileGame ? '' : form.role,
        status:         form.status,
        bio:            form.bio,
        photo_url:      photoUrl ?? form.photo_url,
        attack:         Number(form.attack)         || 0,
        defense:        Number(form.defense)        || 0,
        clutch:         fcMobileGame ? 0 : Number(form.clutch) || 0,
        survival:       fcMobileGame ? 0 : Number(form.survival) || 0,
        iq:             Number(form.iq)             || 0,
        aggression:     Number(form.aggression)     || 0,
        overall_rating: normalizeRating(form.overall_rating),
        ...(shooterGame ? { sensitivity_settings: (() => { try { return JSON.parse(form.sensitivity_settings || '{}'); } catch { return form.sensitivity_settings; } })(), control_code: form.control_code } : { sensitivity_settings: {}, control_code: '' }),
        perks:      splitArr(form.perks),
        strengths:  splitArr(form.strengths),
        weaknesses: splitArr(form.weaknesses),
        previous_aliases: fcMobileGame ? [] : cleanStringList(form.previous_aliases),
        previous_teams: fcMobileGame ? [] : cleanObjectList(form.previous_teams),
        achievements: fcMobileGame ? [] : cleanObjectList(form.achievements),
        performance_history: fcMobileGame ? [] : cleanObjectList(form.performance_history),
      };
      const url = editing ? `/api/athletes/${editing.id}` : '/api/athletes';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    if (!confirm(`Delete ${row.name}?`)) return;
    await fetch(`/api/athletes/${row.id}`, { method: 'DELETE' });
    load();
  }

  const f =
    (k: TextFormKey) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const filtered = gameSlug === 'all' ? rows : rows.filter(r => String(r.game_slug ?? '') === gameSlug);
  const shooterSelected = isShooterGame(form.game_slug);
  const fcMobileSelected = isFcMobileGame(form.game_slug);
  const footballSelected = isFootballGame(form.game_slug);
  const calculatedOverallRating = calculateAthleteOverallRating(form, form.game_slug);
  const formGame = GAMES.find((game) => game.slug === form.game_slug) ?? activeGame ?? DEFAULT_GAME;
  const previewRating = calculatedOverallRating ?? normalizeRating(form.overall_rating);
  const previewAthlete = {
    ign: form.ign || 'Player',
    known_name: form.known_name || form.ign || 'Player',
    team: form.team || null,
    role: form.role || 'Player',
    status: form.status,
    photo_url: photoPreviewUrl || form.photo_url || null,
    attack: Number(form.attack) || 0,
    defense: Number(form.defense) || 0,
    survival: Number(form.survival) || 0,
    clutch: Number(form.clutch) || 0,
    iq: Number(form.iq) || 0,
    game_slug: form.game_slug,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-fn-text uppercase tracking-widest">Athletes</h1>
          <p className="text-fn-muted text-xs mt-0.5">
            {filtered.length} player{filtered.length !== 1 ? 's' : ''}
            {activeGame ? ` — ${activeGame.name}` : ''}
            {gameSlug !== 'all' && <span className="ml-2 text-fn-muted">(filtered by game)</span>}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-fn-black text-sm font-bold px-4 py-2 rounded uppercase tracking-widest transition-colors"
          style={{ background: activeGame?.colors.primary ?? '#00ff41' }}
        >
          <Plus className="w-4 h-4" /> Add Athlete
        </button>
      </div>

      <AdminGameFilter currentSlug={gameSlug} />

      <AdminTable
        loading={loading}
        rows={filtered}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyText="No athletes yet — click Add Athlete"
        columns={[
          {
            key: 'photo_url',
            label: 'Photo',
            render: (r) =>
              r.photo_url ? (
                <img src={String(r.photo_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-fn-card2 border border-fn-gborder" />
              ),
          },
          { key: 'name',           label: 'Name' },
          { key: 'ign',            label: 'IGN' },
          { key: 'team',           label: 'Team' },
          { key: 'game_slug',      label: 'Game' },
          { key: 'role',           label: 'Role' },
          { key: 'overall_rating', label: 'OVR' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'Active'
                    ? 'bg-fn-green/10 text-fn-green'
                    : 'bg-fn-muted/10 text-fn-muted'
                }`}
              >
                {String(r.status)}
              </span>
            ),
          },
        ]}
      />

      <AdminModal
        title={editing ? 'Edit Athlete' : 'Add Athlete'}
        open={open}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {fcMobileSelected ? (
            <>
              <Field label="IGN" required>
                <Input value={form.ign} onChange={f('ign')} placeholder="In-game name / alias" required />
              </Field>

              <Field label="Game">
                <Input value={FC_MOBILE_GAME?.name ?? 'FC Mobile'} readOnly aria-readonly="true" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Overall Rating (auto)">
                  <Input
                    value={calculatedOverallRating ?? ''}
                    readOnly
                    aria-readonly="true"
                    placeholder="N/A until stats are entered"
                  />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onChange={f('status')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Free Agent">Free Agent</option>
                  </Select>
                </Field>
              </div>

              <Field label="Description">
                <Textarea value={form.bio} onChange={f('bio')} placeholder="Athlete bio / description..." />
              </Field>

              <p className="text-fn-muted text-xs uppercase tracking-widest pt-1">
                Player Card Stats (0–100)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="ATT / Attack">
                  <Input type="number" min="0" max="100" value={form.attack} onChange={f('attack')} placeholder="0" />
                </Field>
                <Field label="DEF / Defense">
                  <Input type="number" min="0" max="100" value={form.defense} onChange={f('defense')} placeholder="0" />
                </Field>
                <Field label="IQ">
                  <Input type="number" min="0" max="100" value={form.iq} onChange={f('iq')} placeholder="0" />
                </Field>
              </div>
            </>
          ) : (
            <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required>
              <Input value={form.name} onChange={f('name')} placeholder="Firstname Lastname" required />
            </Field>
            <Field label="IGN" required>
              <Input value={form.ign} onChange={f('ign')} placeholder="In-game name" required />
            </Field>
          </div>

          <Field label="Known Name / Alias">
            <Input value={form.known_name} onChange={f('known_name')} placeholder="Primary public gamertag" />
          </Field>

          <Field label="Game">
            <Select value={form.game_slug} onChange={f('game_slug')}>
              {GAMES.map((game) => <option key={game.slug} value={game.slug}>{game.name}</option>)}
            </Select>
          </Field>

          {!footballSelected && <div className="grid grid-cols-2 gap-3">
            <Field label="Team">
              <Select value={form.team} onChange={f('team')}>
                <option value="">Free Agent</option>
                {teams.map((t) => (
                  <option key={String(t.id)} value={String(t.name)}>
                    {String(t.name)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Role">
              <Input value={form.role} onChange={f('role')} placeholder="IGL / Fragger / Support" />
            </Field>
          </div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Free Agent">Free Agent</option>
              </Select>
            </Field>
            <Field label="Overall Rating (auto)">
              <Input
                value={calculatedOverallRating ?? ''}
                readOnly
                aria-readonly="true"
                placeholder="N/A until stats are entered"
              />
            </Field>
          </div>

          {/* Combat attributes */}
          <p className="text-fn-muted text-xs uppercase tracking-widest pt-1">
            Player Card Stats (0–100)
          </p>
          <p className="text-[10px] text-fn-muted">Overall Rating is automatically calculated from the valid stats below.</p>
          <div className={footballSelected ? "grid grid-cols-3 gap-3" : "grid grid-cols-3 gap-3"}>
            <Field label="ATT / Attack">
              <Input type="number" min="0" max="100" value={form.attack} onChange={f('attack')} placeholder="0" />
            </Field>
            <Field label="DEF / Defense">
              <Input type="number" min="0" max="100" value={form.defense} onChange={f('defense')} placeholder="0" />
            </Field>
            {!footballSelected && <Field label="CLT / Clutch">
              <Input type="number" min="0" max="100" value={form.clutch} onChange={f('clutch')} placeholder="0" />
            </Field>}
            {footballSelected && <Field label="IQ">
              <Input type="number" min="0" max="100" value={form.iq} onChange={f('iq')} placeholder="0" />
            </Field>}
          </div>
          {!footballSelected && <div className="grid grid-cols-3 gap-3">
            <Field label="SUR / Survival">
              <Input type="number" min="0" max="100" value={form.survival} onChange={f('survival')} placeholder="0" />
            </Field>
            <Field label="IQ">
              <Input type="number" min="0" max="100" value={form.iq} onChange={f('iq')} placeholder="0" />
            </Field>
            <Field label="Aggression">
              <Input type="number" min="0" max="100" value={form.aggression} onChange={f('aggression')} placeholder="0" />
            </Field>
          </div>}



          {shooterSelected && (
            <div className="space-y-3 rounded border border-fn-gborder bg-fn-dark/30 p-3">
              <p className="text-fn-muted text-xs uppercase tracking-widest">Shooter Loadout / Settings</p>
              <Field label="Sensitivity Settings (JSON or text)">
                <Textarea
                  value={form.sensitivity_settings}
                  onChange={f('sensitivity_settings')}
                  placeholder='{"general": 100, "red_dot": 85, "2x": 75, "3x": 65, "4x": 55, "6x": 45, "8x": 35}'
                />
              </Field>
              <Field label="Control Code">
                <Input value={form.control_code} onChange={f('control_code')} placeholder="Shareable control layout code" />
              </Field>
            </div>
          )}

          {!footballSelected && <>
          {/* Perks / Strengths / Weaknesses */}
          <Field label="Perks (comma-separated)">
            <Textarea
              value={form.perks}
              onChange={f('perks')}
              placeholder="Clutch King, Entry Fragger, Economy IQ"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Strengths (comma-separated)">
              <Textarea
                value={form.strengths}
                onChange={f('strengths')}
                placeholder="Long-range accuracy, Map control"
              />
            </Field>
            <Field label="Weaknesses (comma-separated)">
              <Textarea
                value={form.weaknesses}
                onChange={f('weaknesses')}
                placeholder="Passive under pressure, Close-range"
              />
            </Field>
          </div>
          </>}

          <Field label="Bio">
            <Textarea value={form.bio} onChange={f('bio')} placeholder="Player description..." />
          </Field>

          {!footballSelected && <>
          <p className="text-fn-muted text-xs uppercase tracking-widest pt-1">
            Career History
          </p>
          <ListEditor
            label="Previous Aliases"
            values={form.previous_aliases}
            placeholder="Former gamertag"
            onChange={(values) => setForm((p) => ({ ...p, previous_aliases: values }))}
          />
          <ObjectListEditor
            label="Previous Teams"
            values={form.previous_teams}
            emptyItem={{ team: '', years: '' }}
            fields={[
              { key: 'team', label: 'Team', placeholder: 'Former team name' },
              { key: 'years', label: 'Years', placeholder: '2023–2024' },
            ]}
            onChange={(values) => setForm((p) => ({ ...p, previous_teams: values }))}
          />
          </>}
          <ObjectListEditor
            label="Titles & Championships"
            values={form.achievements}
            emptyItem={{ title: '', date: '' }}
            fields={[
              { key: 'title', label: 'Title', placeholder: 'Championship title' },
              { key: 'date', label: 'Date', placeholder: '2026' },
            ]}
            onChange={(values) => setForm((p) => ({ ...p, achievements: values }))}
          />
          <ObjectListEditor
            label="Performance History"
            values={form.performance_history}
            emptyItem={{ label: '', value: '', date: '' }}
            fields={[
              { key: 'label', label: 'Metric/Event', placeholder: 'Spring Invitational' },
              { key: 'value', label: 'Result/Stat', placeholder: '2nd place · 31 kills' },
              { key: 'date', label: 'Date', placeholder: 'May 2026' },
            ]}
            onChange={(values) => setForm((p) => ({ ...p, performance_history: values }))}
          />


            </>
          )}

          <Field label="Photo">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-fn-gborder rounded px-3 py-2 hover:border-fn-green/40 transition-colors">
                <Upload className="w-4 h-4 text-fn-muted" />
                <span className="text-fn-muted text-xs">
                  {photoFile ? photoFile.name : 'Upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
              </label>
              <Input
                value={form.photo_url}
                onChange={f('photo_url')}
                placeholder="Or paste image URL"
              />
              <PlayerCardTemplate
                athlete={previewAthlete}
                team={form.team ? { name: form.team } : null}
                rating={previewRating}
                primary={formGame.colors.primary}
                gameName={formGame.shortName.toUpperCase()}
                variant="compact"
              />
            </div>
          </Field>

          {error && (
            <p className="text-fn-red text-xs bg-fn-red/10 border border-fn-red/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <SubmitBtn loading={saving} label={editing ? 'Update Athlete' : 'Add Athlete'} />
        </form>
      </AdminModal>
    </div>
  );
}

export default function AdminAthletesPage() {
  return <Suspense><AthletesContent /></Suspense>;
}
