"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Package } from "lucide-react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image_url: string | null;
  category: string | null;
  featured: boolean;
};

function money(price: number, currency = "NGN") {
  return `${currency === "NGN" ? "₦" : `${currency} `}${Number(price || 0).toLocaleString()}`;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="fn-label mb-1 flex items-center gap-1.5"><ShoppingBag size={10} /> Gear Drop</p>
          <h1 className="font-display text-3xl font-black uppercase text-fn-text">Shop</h1>
        </div>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest text-fn-muted hover:text-fn-green">Back Home</Link>
      </div>

      {loading ? (
        <p className="text-fn-muted text-xs">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="rounded-sm border border-fn-gborder bg-fn-card p-8 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-fn-muted" />
          <p className="text-fn-muted text-sm uppercase tracking-widest">No active products yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card">
              <div className="flex h-40 items-center justify-center bg-fn-card2">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <ShoppingBag className="h-10 w-10 text-fn-green" />}
              </div>
              <div className="p-4">
                <p className="fn-label mb-1">{p.category || "Merch"}</p>
                <h2 className="text-sm font-bold uppercase text-fn-text">{p.name}</h2>
                {p.description && <p className="mt-2 line-clamp-2 text-xs text-fn-muted">{p.description}</p>}
                <p className="mt-3 font-display text-lg font-black text-fn-green">{money(p.price, p.currency || "NGN")}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
