"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Medal, Shield, Trophy, User } from "lucide-react";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  known_name: string | null;
  team: string | null;
  role: string | null;
  kills: number;
  assists: number;
  winrate: number;
  rating?: number;
  overall_rating?: number;
  photo_url: string | null;
  status: string;
  bio: string | null;
  previous_aliases: string[] | string | null;
  previous_teams: { team?: string; years?: string; role?: string }[] | string | null;
  achievements: { title?: string; date?: string }[] | string[] | string | null;
};

function asList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : [item.title, item.date].filter(Boolean).join(" — ")).filter(Boolean);
  try { return asList(JSON.parse(String(value))); } catch { return String(value).split(",").map((x) => x.trim()).filter(Boolean); }
}

function asTeams(value: Athlete["previous_teams"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : [item.team, item.years, item.role].filter(Boolean).join(" — ")).filter(Boolean);
  try { return asTeams(JSON.parse(String(value))); } catch { return asList(value); }
}

export default function AthleteDetailPage({ params }: { params: { id: string } }) {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/athletes/${params.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAthlete)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen p-8 text-fn-muted">Loading athlete dossier...</div>;
  if (!athlete) return <div className="min-h-screen p-8"><Link href="/athletes" className="text-fn-green">← Back to athletes</Link><p className="mt-6 text-fn-muted">Athlete not found.</p></div>;

  const rating = Number(athlete.overall_rating ?? athlete.rating ?? 0);
  const aliases = asList(athlete.previous_aliases);
  const previousTeams = asTeams(athlete.previous_teams);
  const achievements = asList(athlete.achievements);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <Link href="/athletes" className="mb-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-fn-muted hover:text-fn-green"><ArrowLeft size={12} /> Back to roster</Link>
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-sm border border-fn-gborder bg-fn-card p-5">
          <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-sm bg-fn-card2">
            {athlete.photo_url ? <img src={athlete.photo_url} alt={athlete.ign} className="h-full w-full object-cover" /> : <User className="h-16 w-16 text-fn-green" />}
          </div>
          <p className="fn-label mb-1">{athlete.status}</p>
          <h1 className="font-display text-3xl font-black uppercase text-fn-text">{athlete.ign}</h1>
          <p className="mt-1 text-sm text-fn-muted">{athlete.known_name || athlete.name}</p>
          <p className="mt-4 flex items-center gap-2 text-xs text-fn-text"><Shield size={13} className="text-fn-green" /> {athlete.team || "Free Agent"}</p>
          <p className="mt-2 text-xs text-fn-muted">{athlete.role || "Player"}</p>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {[{ label: "KLS", value: athlete.kills }, { label: "AST", value: athlete.assists }, { label: "WR", value: `${athlete.winrate}%` }, { label: "RTG", value: rating.toFixed(1) }].map((s) => (
              <div key={s.label} className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-center"><div className="font-display text-2xl font-black text-fn-green">{s.value}</div><div className="fn-label">{s.label}</div></div>
            ))}
          </div>
          {athlete.bio && <section className="rounded-sm border border-fn-gborder bg-fn-card p-5"><h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-fn-text"><Medal size={14} className="text-fn-green" /> Profile</h2><p className="text-sm leading-relaxed text-fn-muted">{athlete.bio}</p></section>}
          <div className="grid gap-4 lg:grid-cols-3">
            <ListBlock title="Known Aliases" items={aliases} empty="No aliases recorded" />
            <ListBlock title="Previous Teams" items={previousTeams} empty="No previous teams recorded" />
            <ListBlock title="Achievements" items={achievements} empty="No titles recorded" icon="trophy" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ListBlock({ title, items, empty, icon }: { title: string; items: string[]; empty: string; icon?: "trophy" }) {
  return <section className="rounded-sm border border-fn-gborder bg-fn-card p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-fn-text">{icon === "trophy" ? <Trophy size={14} className="text-fn-green" /> : <Medal size={14} className="text-fn-green" />} {title}</h2>{items.length ? <ul className="space-y-2">{items.map((x) => <li key={x} className="text-xs text-fn-muted">• {x}</li>)}</ul> : <p className="text-xs text-fn-muted">{empty}</p>}</section>;
}
