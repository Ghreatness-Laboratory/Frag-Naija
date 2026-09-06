'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, Download, Newspaper, Search, Settings, Sparkles, Swords, Ticket } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { usePWAInstallPrompt } from '@/components/usePWAInstallPrompt';

const PENDING_MENU_ITEMS = ['Virtual', 'Casino'];

const menuLinkClass = 'flex items-center justify-between rounded-sm border border-fn-green/30 bg-fn-green/10 px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-fn-green transition-colors hover:bg-fn-green/20';

export default function MenuPageClient() {
  const router = useRouter();
  const { install: installPWA, installable: pwaInstallable } = usePWAInstallPrompt();
  const [installMessage, setInstallMessage] = useState('');
  const [bookingCode, setBookingCode] = useState('');

  async function handleInstall() {
    const result = await installPWA();
    setInstallMessage(result.message);
  }

  function submitBookingCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = bookingCode.trim();
    if (!code) return;
    router.push(`/wager?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="min-h-screen bg-fn-black px-4 py-8 pb-28 text-fn-text sm:px-8 lg:px-12">
      <section className="mx-auto max-w-2xl">
        <div className="mb-6 border-b border-fn-gborder pb-4">
          <p className="fn-label text-fn-green">Navigation</p>
          <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-widest">Menu</h1>
          <p className="mt-2 text-xs text-fn-muted">Quick actions and upcoming feature destinations.</p>
        </div>

        <div className="grid gap-2">
          <Link href="/select-game" className={menuLinkClass}>
            <span>Virtual Games</span><ChevronRight size={15} />
          </Link>
          <Link href="/fantasy-league" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Sparkles size={15} /> Fantasy League</span><ChevronRight size={15} />
          </Link>
          <Link href="/custom-wager" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Swords size={15} /> Custom Wager</span><ChevronRight size={15} />
          </Link>
          <Link href="/gaming-alerts" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Bell size={15} /> Gaming Alerts</span><ChevronRight size={15} />
          </Link>
          <Link href="/settings" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Settings size={15} /> Settings</span><ChevronRight size={15} />
          </Link>
          <Link href="/news" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Newspaper size={15} /> News</span><ChevronRight size={15} />
          </Link>
          {pwaInstallable && (
            <button type="button" onClick={handleInstall} className={menuLinkClass}>
              <span className="flex items-center gap-2"><Download size={15} /> Install App</span><ChevronRight size={15} />
            </button>
          )}
          {installMessage && <p className="rounded-sm border border-fn-gborder bg-fn-card px-4 py-3 text-xs leading-relaxed text-fn-muted">{installMessage}</p>}
          {PENDING_MENU_ITEMS.map((item) => (
            <button key={item} type="button" disabled title="Pending destination confirmation" className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark px-4 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-fn-muted opacity-70">
              {item}<span className="text-[9px]">TBD</span>
            </button>
          ))}
          <Link href="/search" className={menuLinkClass}>
            <span className="flex items-center gap-2"><Search size={15} /> Search</span><ChevronRight size={15} />
          </Link>
          <form onSubmit={submitBookingCode} className="rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 p-4">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-fn-yellow" htmlFor="menu-booking-code"><Ticket size={15} /> Load Code</label>
            <div className="mt-3 flex gap-2">
              <input id="menu-booking-code" value={bookingCode} onChange={(event) => setBookingCode(event.target.value)} placeholder="Enter code" className="min-w-0 flex-1 rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-xs text-fn-text outline-none focus:border-fn-green/60" />
              <button type="submit" className="fn-btn px-4 py-2 text-[10px]">Load</button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-[10px] leading-relaxed text-fn-muted">
          Virtual Games opens game selection. Individual game spaces require login; modes and roadmap cards are scoped to the active game.
        </p>
      </section>
    </main>
  );
}
