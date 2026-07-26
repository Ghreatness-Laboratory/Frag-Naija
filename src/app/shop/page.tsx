'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useGame } from '@/context/GameContext';

type ShopItem = { id: string; name: string; description: string | null; price: number; currency: string | null; image_url: string | null; category: string | null; status: string | null; };

export default function ShopPage() {
  const { selectedGame } = useGame();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const primary = selectedGame.colors.primary;

  useEffect(() => {
    fetch(`/api/shop-items?game_slug=${encodeURIComponent(selectedGame.slug)}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : []).then(setItems).finally(() => setLoading(false));
  }, [selectedGame.slug]);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <p className="fn-label mb-2 flex items-center gap-2"><ShoppingBag size={12} style={{ color: primary }} /> SHOP</p>
      <h1 className="font-display text-4xl font-black uppercase text-fn-text">Frag Naija Shop</h1>
      {loading ? <p className="mt-8 text-xs text-fn-muted">Loading shop items…</p> : items.length === 0 ? <p className="mt-8 text-xs text-fn-muted">No published shop items yet.</p> : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => <article key={item.id} className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card"><div className="flex h-48 items-center justify-center bg-fn-dark">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ShoppingBag style={{ color: primary }} />}</div><div className="p-4"><div className="fn-label mb-1">{item.category || item.status || 'Item'}</div><h2 className="text-sm font-black uppercase text-fn-text">{item.name}</h2>{item.description && <p className="mt-2 text-[11px] leading-relaxed text-fn-muted">{item.description}</p>}<div className="mt-3 text-sm font-black" style={{ color: primary }}>{item.currency || 'NGN'} {Number(item.price || 0).toLocaleString()}</div></div></article>)}
        </div>
      )}
    </div>
  );
}
