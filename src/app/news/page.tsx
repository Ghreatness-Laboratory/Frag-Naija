"use client";

import BrandedLoader from "@/components/common/BrandedLoader";
import { useAuthGate } from "@/components/common/LoginGate";
import { ArrowUpRight, Clock, Eye, Heart, ImageOff, Newspaper, User, Filter } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GAMES } from "@/lib/games";

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
  category?: string | null;
  game_slug?: string | null;
};

const CATEGORIES = ['All', 'Trending', 'Hot', 'Gossip', 'Transfer News'];

function formatDate(value?: string | null) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function imageFor(item: NewsItem): string {
  return item.image_url || "";
}

function gameLabel(slug?: string | null) {
  if (!slug) return null;
  return GAMES.find((g) => g.slug === slug)?.name || slug;
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
  const [showLoader, setShowLoader] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState('');

  useEffect(() => {
    let active = true;
    let minTimer: ReturnType<typeof setTimeout>;
    
    setLoading(true);
    setShowLoader(true);
    
    fetch("/api/news", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) setArticles(Array.isArray(data) ? data : []);
      })
      .catch(() => { if (active) setArticles([]); })
      .finally(() => {
        // Ensure minimum 600ms loader display
        minTimer = setTimeout(() => {
          if (active) {
            setLoading(false);
            setShowLoader(false);
          }
        }, 650);
      });
    
    return () => { 
      active = false;
      clearTimeout(minTimer);
    };
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesGame = !selectedGame || article.game_slug === selectedGame;
      return matchesCategory && matchesGame;
    });
  }, [articles, selectedCategory, selectedGame]);

  // Get unique games from articles for the filter dropdown
  const availableGames = useMemo(() => {
    const games = new Set(articles.map((a) => a.game_slug).filter(Boolean) as string[]);
    return Array.from(games);
  }, [articles]);

  const lead = useMemo(() => filteredArticles[0] ?? null, [filteredArticles]);
  const rest = useMemo(() => filteredArticles.slice(1), [filteredArticles]);

  if (showLoader || authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-fn-black"><BrandedLoader label="LOADING NEWS" size="sm" /></div>;
  }

  if (!filteredArticles.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fn-black px-4 text-center">
        <Newspaper className="h-12 w-12 text-fn-muted" />
        <p className="text-sm uppercase tracking-widest text-fn-muted">No news matches these filters</p>
        <button onClick={() => { setSelectedCategory('All'); setSelectedGame(''); }} className="fn-btn mt-2 px-4 py-2 text-xs">Clear filters</button>
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

        {/* Filter Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-fn-muted" />
          <span className="text-[10px] font-black uppercase tracking-widest text-fn-muted">Category:</span>
          <div className="inline-flex border border-fn-gborder bg-fn-black p-0.5 text-[9px] font-black uppercase tracking-widest">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 transition-colors ${selectedCategory === cat ? 'bg-fn-green text-fn-black' : 'text-fn-muted hover:text-fn-green'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-fn-muted">Game:</span>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="border border-fn-gborder bg-fn-black px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-fn-text focus:border-fn-green focus:outline-none"
          >
            <option value="">All Games</option>
            {GAMES.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Lead Story - Compact Hero */}
        {lead && (
          <article className="mb-4 grid overflow-hidden border border-fn-green/30 bg-fn-card md:grid-cols-2">
            <div className="relative h-48 border-b border-fn-gborder md:h-auto md:border-b-0 md:border-r">
              <img src={imageFor(lead)} alt={lead.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-fn-black via-fn-black/45 to-transparent" />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {lead.category && (
                  <span className="border border-fn-green/40 bg-fn-black/80 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-fn-green">{lead.category}</span>
                )}
                {lead.game_slug && (
                  <span className="border border-fn-green/40 bg-fn-black/80 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-fn-green">{gameLabel(lead.game_slug)}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center p-4">
              <h2 className="font-display text-xl font-black uppercase leading-tight tracking-widest text-fn-text sm:text-2xl">{lead.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fn-muted">{lead.excerpt}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-widest text-fn-muted">
                <span className="flex items-center gap-1"><User size={9} /> {lead.author || "FragNaija Desk"}</span>
                <span className="flex items-center gap-1"><Clock size={9} /> {formatDate(lead.published_at || lead.created_at)}</span>
                <span className="flex items-center gap-1"><Heart size={9} />{lead.like_count}</span>
                <span className="flex items-center gap-1"><Eye size={9} />{lead.view_count}</span>
              </div>
              {canRead ? <Link href={`/news/${lead.id}`} className="mt-3 inline-flex items-center gap-2 bg-fn-green px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-fn-black">Read Full <ArrowUpRight size={11} /></Link> : <LoginTeaser next={`/news/${lead.id}`} />}
            </div>
          </article>
        )}

        {/* Article Grid - Dense Magazine Layout */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rest.map((article) => (
            <article key={article.id} className="group flex flex-col overflow-hidden border border-fn-gborder bg-fn-card transition-colors hover:border-fn-green/40">
              <div className="relative h-32 shrink-0 border-b border-fn-gborder">
                <img src={imageFor(article)} alt={article.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                {(article.category || article.game_slug) && (
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {article.category && (
                      <span className="border border-fn-green/40 bg-fn-black/80 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-fn-green">{article.category}</span>
                    )}
                    {article.game_slug && (
                      <span className="border border-fn-green/40 bg-fn-black/80 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-fn-green">{gameLabel(article.game_slug)}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex min-h-[80px] flex-col justify-between p-3">
                <div>
                  <h3 className="line-clamp-2 font-display text-sm font-black uppercase tracking-widest text-fn-text">{article.title}</h3>
                  <p className="mt-1 text-[9px] uppercase tracking-widest text-fn-muted">{formatDate(article.published_at || article.created_at)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-fn-gborder pt-2">
                  <span className="text-[8px] uppercase tracking-widest text-fn-muted"><Heart size={8} className="mr-0.5 inline" />{article.like_count}</span>
                  {canRead ? <Link href={`/news/${article.id}`} className="text-[8px] font-black uppercase tracking-widest text-fn-green hover:underline">Read</Link> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
