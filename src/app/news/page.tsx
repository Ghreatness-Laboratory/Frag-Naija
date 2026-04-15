"use client";
import { useState, useEffect, useCallback } from "react";
import { Newspaper, Clock, User, ChevronRight } from "lucide-react";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  author: string | null;
  published: boolean;
  created_at: string;
};

function formatDate(val: string) {
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/news", { cache: "no-store" });
    if (res.ok) {
      const data: NewsItem[] = await res.json();
      setArticles(Array.isArray(data) ? data : []);
      if (data.length > 0) setSelected(data[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fn-black">
        <div className="w-6 h-6 border-2 border-fn-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fn-black gap-4">
        <Newspaper className="w-12 h-12 text-fn-muted" />
        <p className="text-fn-muted text-sm uppercase tracking-widest">No news published yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Article list */}
      <aside className="lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-fn-gborder flex-shrink-0">
        <div className="p-4 border-b border-fn-gborder">
          <div className="fn-label mb-0.5 flex items-center gap-1.5">
            <Newspaper size={9} className="text-fn-green" /> INTEL FEED
          </div>
          <h1 className="font-display text-xl font-black uppercase text-fn-text">NEWS</h1>
        </div>

        <div className="overflow-y-auto max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-10rem)]">
          {articles.map((article) => {
            const isActive = selected?.id === article.id;
            return (
              <button
                key={article.id}
                onClick={() => setSelected(article)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-fn-gborder/50 transition-all text-left ${
                  isActive
                    ? "bg-fn-green/10 border-l-2 border-l-fn-green"
                    : "hover:bg-fn-card/50 border-l-2 border-l-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-fn-text leading-snug line-clamp-2">
                    {article.title}
                  </div>
                  <div className="fn-label mt-1 flex items-center gap-1">
                    <Clock size={7} /> {formatDate(article.created_at)}
                  </div>
                </div>
                <ChevronRight
                  size={12}
                  className={
                    isActive
                      ? "text-fn-green flex-shrink-0 mt-0.5"
                      : "text-fn-muted flex-shrink-0 mt-0.5"
                  }
                />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right: Article detail */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {selected && (
          <div className="max-w-3xl">
            {selected.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selected.image_url}
                alt={selected.title}
                className="w-full h-48 sm:h-64 object-cover rounded-sm border border-fn-gborder mb-4"
              />
            )}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6">
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-fn-text tracking-wide mb-3">
                {selected.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 fn-label mb-4 pb-4 border-b border-fn-gborder">
                {selected.author && (
                  <span className="flex items-center gap-1">
                    <User size={9} /> {selected.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={9} /> {formatDate(selected.created_at)}
                </span>
              </div>
              <div className="text-fn-muted text-[12px] leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
