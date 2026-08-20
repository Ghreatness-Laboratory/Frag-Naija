"use client";

import BrandedLoader from "@/components/common/BrandedLoader";
import { useAuthGate } from "@/components/common/LoginGate";
import { ArrowUpRight, Clock, Eye, Heart, ImageOff, MessageCircle, Newspaper, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
  pinned?: boolean;
  like_count: number;
  view_count: number;
  comment_count: number;
};

function formatDate(value?: string | null) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function CompactNewsImage({ article, lead = false }: { article: NewsItem; lead?: boolean }) {
  if (article.image_url) {
    return (
      <img
        src={article.image_url}
        alt={article.title}
        className="h-full w-full object-cover"
        loading={lead ? "eager" : "lazy"}
        fetchPriority={lead ? "high" : "auto"}
        decoding="async"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(77,255,110,.12),transparent_58%)] bg-fn-dark">
      <div className="flex flex-col items-center gap-2 text-center text-fn-muted">
        <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-fn-green/25 bg-fn-green/10 text-fn-green">
          <ImageOff size={18} />
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.24em]">Image pending</span>
      </div>
    </div>
  );
}

function LoginTeaser({ next }: { next: string }) {
  return (
    <div className="mt-3 border border-fn-green/30 bg-fn-green/10 p-3 text-xs text-fn-muted">
      Full article access, likes, and comments require login. <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-black uppercase tracking-widest text-fn-green">Login to continue</Link>
    </div>
  );
}

export default function NewsPage() {
  const { user, loading: authLoading } = useAuthGate();
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/news", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (active) setArticles(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setArticles([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const lead = useMemo(() => articles[0] ?? null, [articles]);
  const rest = useMemo(() => articles.slice(1), [articles]);

  if (loading || authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-fn-black"><BrandedLoader label="Loading news" size="sm" /></div>;
  }

  if (!lead) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fn-black px-4 text-center">
        <Newspaper className="h-12 w-12 text-fn-muted" />
        <p className="text-sm uppercase tracking-widest text-fn-muted">No news published yet</p>
      </main>
    );
  }

  const canRead = Boolean(user);

  return (
    <main className="min-h-screen bg-fn-black px-3 py-4 pb-28 text-fn-text sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-fn-gborder pb-3">
          <div>
            <p className="fn-label flex items-center gap-2 text-fn-green"><Newspaper size={12} /> FragNaija Magazine</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest sm:text-4xl">News</h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-fn-muted">Lead stories, tournament context, roster movement, and Nigerian esports culture in one signal-green feed.</p>
          </div>
          {!canRead && <Link href="/login?next=/news" className="fn-btn px-4 py-2 text-xs">Login for full stories</Link>}
        </div>

        <article className="grid overflow-hidden rounded-sm border border-fn-green/25 bg-fn-card shadow-[0_18px_60px_rgba(0,0,0,0.25)] lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
          <div className="relative aspect-[16/9] max-h-[48vh] min-h-[190px] border-b border-fn-gborder lg:max-h-[420px] lg:border-b-0 lg:border-r">
            <CompactNewsImage article={lead} lead />
            <div className="absolute inset-0 bg-gradient-to-t from-fn-black/60 via-fn-black/12 to-transparent" />
            <div className="absolute left-3 top-3 border border-fn-green/40 bg-fn-black/80 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-fn-green">Lead Story</div>
          </div>
          <div className="flex flex-col justify-center p-4 sm:p-5 lg:p-6">
            <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-widest text-fn-muted">
              <span className="flex items-center gap-1"><User size={10} /> {lead.author || "FragNaija Desk"}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(lead.published_at || lead.created_at)}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-black uppercase leading-tight tracking-widest text-fn-text sm:text-3xl">{lead.title}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fn-muted">{lead.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fn-muted">
              <span className="border border-fn-gborder px-2 py-1"><Heart size={11} className="mr-1 inline" />{lead.like_count}</span>
              <span className="border border-fn-gborder px-2 py-1"><MessageCircle size={11} className="mr-1 inline" />{lead.comment_count}</span>
              <span className="border border-fn-gborder px-2 py-1"><Eye size={11} className="mr-1 inline" />{lead.view_count}</span>
              {canRead ? <Link href={`/news/${lead.id}`} className="ml-auto inline-flex items-center gap-2 bg-fn-green px-4 py-2 text-[10px] font-black uppercase tracking-widest text-fn-black">Read Feature <ArrowUpRight size={12} /></Link> : null}
            </div>
            {!canRead && <LoginTeaser next={`/news/${lead.id}`} />}
          </div>
        </article>

        {rest.length > 0 && (
          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rest.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card">
                <div className="relative aspect-[16/9] max-h-40 border-b border-fn-gborder">
                  <CompactNewsImage article={article} />
                </div>
                <div className="p-4">
                  <p className="fn-label text-fn-green">{formatDate(article.published_at || article.created_at)}</p>
                  <h3 className="mt-2 line-clamp-2 font-display text-lg font-black uppercase tracking-widest">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-fn-muted">{article.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-fn-gborder pt-3">
                    <div className="flex gap-2 text-[9px] uppercase tracking-widest text-fn-muted">
                      <span><Heart size={10} className="mr-1 inline" />{article.like_count}</span>
                      <span><MessageCircle size={10} className="mr-1 inline" />{article.comment_count}</span>
                    </div>
                    {canRead ? <Link href={`/news/${article.id}`} className="text-[10px] font-black uppercase tracking-widest text-fn-green">Read</Link> : <Link href={`/login?next=${encodeURIComponent(`/news/${article.id}`)}`} className="text-[10px] font-black uppercase tracking-widest text-fn-green">Login</Link>}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
