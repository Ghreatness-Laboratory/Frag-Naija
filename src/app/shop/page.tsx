'use client';

import { useEffect, useState } from 'react';
import { Gamepad2, Headphones, ShoppingBag } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import BrandedLoader from '@/components/common/BrandedLoader';
import CollapsibleText from '@/components/common/CollapsibleText';
import OptimizedImage from '@/components/common/OptimizedImage';

type ShopItem = { id: string; name: string; description: string | null; price: number; currency: string | null; image_url: string | null; category: string | null; status: string | null; tutorial_video_url?: string | null; };

export default function ShopPage() {
  const { selectedGame } = useGame();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const primary = selectedGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const categories = ['All', 'Account', 'iMercs', 'Thumb Sleeves', 'Headsets', 'Gear'];
  const [category, setCategory] = useState('All');
  const visibleItems = items.filter((item) => category === 'All' || item.category === category);

  useEffect(() => {
    fetch('/api/shop-items', { next: { revalidate: 120 } }).then((r) => r.ok ? r.json() : []).then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <p className="fn-label mb-2 flex items-center gap-2"><ShoppingBag size={12} style={{ color: primary }} /> SHOP</p>
      <h1 className="font-display text-4xl font-black uppercase text-fn-text">Frag Naija Shop</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><a href="#accounts" className="rounded-sm border border-fn-gborder bg-fn-card p-4 transition-all hover:border-fn-green/40"><Gamepad2 className="mb-3 text-fn-green" size={20} /><h2 className="text-sm font-black uppercase text-fn-text">Buy Accounts</h2><p className="mt-1 text-[11px] text-fn-muted">PUBG Mobile and other supported game accounts.</p></a><a href="#gear" className="rounded-sm border border-fn-gborder bg-fn-card p-4 transition-all hover:border-fn-green/40"><Headphones className="mb-3 text-fn-green" size={20} /><h2 className="text-sm font-black uppercase text-fn-text">Buy iMercs & Gear</h2><p className="mt-1 text-[11px] text-fn-muted">Thumb sleeves, headsets, and gaming accessories.</p></a></div><div className="mt-6 flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${category === item ? 'border-fn-green bg-fn-green/10 text-fn-green' : 'border-fn-gborder text-fn-muted'}`}>{item}</button>)}</div>{loading ? <div className="mt-8 flex justify-center"><BrandedLoader label="Loading shop items" /></div> : visibleItems.length === 0 ? <p className="mt-8 text-xs text-fn-muted">No published shop items match this category yet.</p> : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleItems.map((item) => <article key={item.id} id={item.category === 'Account' ? 'accounts' : item.category === 'iMercs' || item.category === 'Thumb Sleeves' || item.category === 'Headsets' ? 'gear' : undefined} className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card"><div className="flex h-48 items-center justify-center bg-fn-dark">{item.image_url ? <OptimizedImage src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ShoppingBag style={{ color: primary }} />}</div><div className="p-4"><div className="fn-label mb-1">{item.category || item.status || 'Item'}</div><h2 className="text-sm font-black uppercase text-fn-text">{item.name}</h2>{item.description && <CollapsibleText text={item.description} className="mt-2 text-[11px] leading-relaxed text-fn-muted" />}{item.tutorial_video_url && <a href={item.tutorial_video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-sm border border-fn-green/30 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-fn-green transition-all hover:bg-fn-green/10">Watch Tutorial Video →</a>}<div className="mt-3 text-sm font-black" style={{ color: primary }}>{item.currency || 'NGN'} {Number(item.price || 0).toLocaleString()}</div></div></article>)}
        </div>
      )}
    </div>
  );
}
