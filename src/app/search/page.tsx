import Link from "next/link";
import { Search } from "lucide-react";

const SEARCH_SHORTCUTS = [
  { label: "Athletes", href: "/athletes", description: "Find player cards, roles, status, and combat stats." },
  { label: "Teams", href: "/teams", description: "Browse squads, rankings, and roster strength." },
  { label: "Tournaments", href: "/tournaments", description: "Track upcoming and live competitions." },
  { label: "Wager Markets", href: "/wager", description: "Jump into live wager markets and picks." },
];

export default function SearchPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <section className="rounded-sm border border-fn-gborder bg-fn-card p-6">
        <p className="fn-label mb-3 flex items-center gap-2 text-fn-green">
          <Search size={12} /> SEARCH
        </p>
        <h1 className="font-display text-3xl font-black uppercase text-fn-text">Find anything on Frag Naija</h1>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-fn-muted">
          Choose a section below to search rosters, teams, tournaments, and wager markets.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SEARCH_SHORTCUTS.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-sm border border-fn-gborder bg-fn-dark p-4 transition-colors hover:border-fn-green/50">
              <span className="text-xs font-black uppercase tracking-widest text-fn-text">{item.label}</span>
              <span className="mt-2 block text-[10px] leading-relaxed text-fn-muted">{item.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
