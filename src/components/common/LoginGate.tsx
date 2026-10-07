"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function useAuthGate() {
  return useAuth();
}

export function LoginGate({
  title = "Login Required",
  heading = "Login before viewing game content",
  message = "Sign in to access game-scoped athletes, teams, stats, and profile details.",
  next,
}: {
  title?: string;
  heading?: string;
  message?: string;
  next?: string;
}) {
  const href = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <main className="min-h-screen bg-fn-black px-4 py-16 text-fn-text">
      <section className="mx-auto max-w-xl border border-fn-green/30 bg-fn-card p-6 text-center">
        <User className="mx-auto text-fn-green" size={28} />
        <p className="fn-label mt-4 text-fn-green">{title}</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-widest">{heading}</h1>
        <p className="mt-3 text-xs leading-relaxed text-fn-muted">{message}</p>
        <Link href={href} className="mt-5 inline-flex bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black">Login / Sign Up</Link>
      </section>
    </main>
  );
}
