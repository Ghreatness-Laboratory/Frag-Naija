"use client";

import OptimizedImage from '../../components/common/OptimizedImage';
import BrandedLoader from "@/components/common/BrandedLoader";
import { useAuthGate } from "@/components/common/LoginGate";
import { ArrowUpRight, Clock, Eye, Heart, MessageCircle, Newspaper, User } from "lucide-react";
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

function imageFor(article: NewsItem) {
  return article.image_url || "/logo-icon.jpeg";
}

function LoginTeaser({ next }: { next: string }) {
  return (
    <div className="mt-4 border border-fn-green/30 bg-fn-green/10 p-3 text-xs text-fn-muted">
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
    <main className="min-h-screen bg-fn-black px-3 py-5 pb-28 text-fn-text sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-fn-gborder pb-4">
          <div>
            <p className="fn-label flex items-center gap-2 text-fn-green"><Newspaper size={12} /> FragNaija Magazine</p>
            <h1 className="mt-1 font-display text-3xl font-black uppercase tracking-widest sm:text-5xl">News</h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">Lead stories, tournament context, roster movement, and Nigerian esports culture in one signal-green feed.</p>
          </div>
          {!canRead && <Link href="/login?next=/news" className="fn-btn px-4 py-2 text-xs">Login for full stories</Link>}
        </div>

        <article className="grid overflow-hidden border border-fn-green/30 bg-fn-card lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative min-h-[260px] border-b border-fn-gborder lg:border-b-0 lg:border-r">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <OptimizedImage src={imageFor(lead)} alt={lead.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-fn-black via-fn-black/45 to-transparent" />
            <div className="absolute left-4 top-4 border border-fn-green/40 bg-fn-black/80 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fn-green">Lead Story</div>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-fn-muted">
              <span className="flex items-center gap-1"><User size={11} /> {lead.author || "FragNaija Desk"}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(lead.published_at || lead.created_at)}</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-black uppercase leading-tight tracking-widest text-fn-text">{lead.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-fn-muted">{lead.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-fn-muted">
              <span className="border border-fn-gborder px-2 py-1"><Heart size={11} className="mr-1 inline" />{lead.like_count}</span>
              <span className="border border-fn-gborder px-2 py-1"><MessageCircle size={11} className="mr-1 inline" />{lead.comment_count}</span>
              <span className="border border-fn-gborder px-2 py-1"><Eye size={11} className="mr-1 inline" />{lead.view_count}</span>
            </div>
            {canRead ? <Link href={`/news/${lead.id}`} className="mt-6 inline-flex items-center gap-2 bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Read feature <ArrowUpRight size={14} /></Link> : <LoginTeaser next={`/news/${lead.id}`} />}
          </div>
        </article>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((article) => (
            <article key={article.id} className="border border-fn-gborder bg-fn-card">
              <div className="relative h-40 border-b border-fn-gborder">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <OptimizedImage src={imageFor(article)} alt={article.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4">
                <p className="fn-label text-fn-green">{formatDate(article.published_at || article.created_at)}</p>
                <h3 className="mt-2 line-clamp-2 font-display text-xl font-black uppercase tracking-widest">{article.title}</h3>
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
      </section>
    </main>
  );
}
