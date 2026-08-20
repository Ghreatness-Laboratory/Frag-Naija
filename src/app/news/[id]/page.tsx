"use client";

import BrandedLoader from "@/components/common/BrandedLoader";
import { Clock, Copy, Eye, Heart, MessageCircle, Send, Share2, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Comment = { id: string; body: string; created_at: string; user_id: string };
type Article = {
  id: string; title: string; content: string; excerpt: string; image_url: string | null; author: string | null; published_at: string | null; created_at: string;
  like_count: number; view_count: number; comment_count: number; liked_by_me: boolean; comments: Comment[];
};

function formatDate(value?: string | null) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Date TBA";
  return new Intl.DateTimeFormat("en-NG", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("fn_session_id");
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("fn_session_id", sessionId);
  }
  return sessionId;
}

export default function NewsArticlePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasLikedSession, setHasLikedSession] = useState(false);

  // Check if user already liked this article in current session (for anonymous users)
  useEffect(() => {
    const likedKey = `liked_article_${id}`;
    const previouslyLiked = localStorage.getItem(likedKey);
    if (previouslyLiked === "true") {
      setHasLikedSession(true);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/news/${id}`, { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Article unavailable");
        return data;
      })
      .then((data) => { if (active) setArticle(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Article unavailable"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function toggleLike() {
    if (!article) return;
    const likedKey = `liked_article_${article.id}`;
    const alreadyLikedThisSession = localStorage.getItem(likedKey) === "true";
    
    // For anonymous users, prevent rapid re-liking within the same session
    if (alreadyLikedThisSession && !article.liked_by_me) {
      // Already liked this article in this session, don't allow another like
      return;
    }
    
    const res = await fetch(`/api/news/${article.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "like" }) });
    if (res.ok) {
      const updated = await res.json();
      setArticle(updated);
      // Track that user liked this article in this session (for anonymous duplicate prevention)
      if (updated.liked_by_me) {
        localStorage.setItem(likedKey, "true");
        setHasLikedSession(true);
      } else {
        localStorage.removeItem(likedKey);
        setHasLikedSession(false);
      }
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!article || !comment.trim()) return;
    const res = await fetch(`/api/news/${article.id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", body: comment }) });
    if (res.ok) {
      const saved = await res.json();
      setArticle((current) => current ? { ...current, comments: [saved, ...current.comments], comment_count: current.comment_count + 1 } : current);
      setComment("");
    } else {
      const errorData = await res.json();
      if (errorData.error === "Login required to comment") {
        // Redirect to login or show login prompt
        window.location.href = `/login?next=/news/${article.id}`;
      }
    }
  }

  async function shareArticle() {
    if (!article) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.excerpt, url }).catch(() => null);
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-fn-black"><BrandedLoader label="Loading article" size="sm" /></div>;
  if (error || !article) return <main className="min-h-screen bg-fn-black px-4 py-16 text-center text-fn-muted">{error || "Article not found"}</main>;

  return (
    <main className="min-h-screen bg-fn-black px-3 py-5 pb-28 text-fn-text sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <div className="overflow-hidden border border-fn-green/30 bg-fn-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.image_url || "/logo-icon.jpeg"} alt={article.title} className="h-[260px] w-full object-cover sm:h-[420px]" />
          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-fn-muted">
              <span className="flex items-center gap-1"><User size={11} /> {article.author || "FragNaija Desk"}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(article.published_at || article.created_at)}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight tracking-widest sm:text-5xl">{article.title}</h1>
            <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-fn-muted sm:text-base">{article.content}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border border-fn-gborder bg-fn-card p-3">
          <button onClick={toggleLike} className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-widest ${article.liked_by_me ? "border-fn-green bg-fn-green text-fn-black" : "border-fn-gborder text-fn-green"}`}><Heart size={14} /> {article.like_count}</button>
          <button onClick={shareArticle} className="inline-flex items-center gap-2 border border-fn-gborder px-3 py-2 text-xs font-black uppercase tracking-widest text-fn-green">{copied ? <Copy size={14} /> : <Share2 size={14} />} {copied ? "Copied" : "Share"}</button>
          <span className="inline-flex items-center gap-2 border border-fn-gborder px-3 py-2 text-xs font-black uppercase tracking-widest text-fn-muted"><MessageCircle size={14} /> {article.comment_count}</span>
          <span className="inline-flex items-center gap-2 border border-fn-gborder px-3 py-2 text-xs font-black uppercase tracking-widest text-fn-muted"><Eye size={14} /> {article.view_count}</span>
        </div>

        <section className="mt-4 border border-fn-gborder bg-fn-card p-4">
          <h2 className="font-display text-xl font-black uppercase tracking-widest">Comments</h2>
          <form onSubmit={submitComment} className="mt-3 flex gap-2">
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" className="min-w-0 flex-1 border border-fn-gborder bg-fn-black px-3 py-2 text-sm outline-none focus:border-fn-green" />
            <button type="submit" className="bg-fn-green px-4 py-2 text-fn-black"><Send size={15} /></button>
          </form>
          <div className="mt-4 space-y-2">
            {article.comments.length === 0 ? <p className="text-xs text-fn-muted">No comments yet. Start the conversation.</p> : article.comments.map((item) => (
              <div key={item.id} className="border border-fn-gborder bg-fn-black/60 p-3">
                <p className="text-sm text-fn-text">{item.body}</p>
                <p className="mt-2 text-[9px] uppercase tracking-widest text-fn-muted">{formatDate(item.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
