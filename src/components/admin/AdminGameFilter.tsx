'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { GAMES } from '@/lib/games';

export default function AdminGameFilter({ currentSlug }: { currentSlug: string }) {
  const router     = useRouter();
  const pathname   = usePathname();

  function pick(slug: string) {
    const params = new URLSearchParams();
    if (slug !== 'all') params.set('game', slug);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-6">
      <button
        onClick={() => pick('all')}
        className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-sm border transition-all"
        style={currentSlug === 'all'
          ? { background: 'rgb(var(--fn-green))', color: 'rgb(var(--fn-black))', borderColor: 'rgb(var(--fn-green))' }
          : { background: 'transparent', color: 'rgb(var(--fn-muted))', borderColor: 'rgb(var(--fn-gborder))' }}
      >
        ALL GAMES
      </button>
      {GAMES.map((g) => (
        <button
          key={g.slug}
          onClick={() => pick(g.slug)}
          className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded-sm border transition-all flex items-center gap-1.5"
          style={currentSlug === g.slug
            ? { background: g.colors.primary, color: 'rgb(var(--fn-black))', borderColor: g.colors.primary }
            : { background: 'transparent', color: 'rgb(var(--fn-muted))', borderColor: 'rgb(var(--fn-gborder))' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: currentSlug === g.slug ? 'rgb(var(--fn-black))' : g.colors.primary }}
          />
          {g.shortName}
        </button>
      ))}
    </div>
  );
}
