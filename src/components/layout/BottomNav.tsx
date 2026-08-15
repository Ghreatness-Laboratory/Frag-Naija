"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Home, Menu, Search, Shield, Target, Ticket, User, X } from "lucide-react";
import { useEffect, useState } from "react";

const WAGER_COUNT_EVENT = "fn-wager-count";
const WAGER_COUNT_KEY = "fn-wager-count";

const HIDDEN_ROUTE_PREFIXES = [
  "/admin",
  "/auth",
  "/login",
  "/register",
  "/select-game",
];

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home, match: (path: string) => path === "/" },
  { label: "Menu", icon: Menu, match: (path: string) => path.startsWith("/search") },
  { label: "Athletes", href: "/athletes", icon: User, match: (path: string) => path.startsWith("/athletes") },
  { label: "Teams", href: "/teams", icon: Shield, match: (path: string) => path.startsWith("/teams") },
  { label: "Wager", href: "/wager", icon: Target, match: (path: string) => path.startsWith("/wager") },
] as const;

const PENDING_MENU_ITEMS = ["Virtual", "Casino", "Games", "Fantasy League"];

function readWagerCount() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(WAGER_COUNT_KEY) ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function publishWagerCount(count: number) {
  if (typeof window === "undefined") return;

  const normalizedCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  window.localStorage.setItem(WAGER_COUNT_KEY, String(normalizedCount));
  window.dispatchEvent(new CustomEvent(WAGER_COUNT_EVENT, { detail: normalizedCount }));
}

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [wagerCount, setWagerCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadCodeOpen, setLoadCodeOpen] = useState(false);
  const [bookingCode, setBookingCode] = useState("");

  useEffect(() => {
    setWagerCount(readWagerCount());

    function handleCountChange(event: Event) {
      setWagerCount(
        event instanceof CustomEvent && typeof event.detail === "number"
          ? Math.max(0, Math.floor(event.detail))
          : readWagerCount()
      );
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === WAGER_COUNT_KEY) setWagerCount(readWagerCount());
    }

    window.addEventListener(WAGER_COUNT_EVENT, handleCountChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WAGER_COUNT_EVENT, handleCountChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setLoadCodeOpen(false);
  }, [pathname]);

  if (HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  function submitBookingCode() {
    const code = bookingCode.trim();
    if (!code) return;
    setMenuOpen(false);
    setLoadCodeOpen(false);
    router.push(`/wager?code=${encodeURIComponent(code)}`);
  }

  function navItemClass(isActive: boolean) {
    return `relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1 text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${
      isActive ? "text-fn-text" : "text-fn-muted hover:text-fn-green"
    }`;
  }

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <section
            aria-label="Bottom navigation menu"
            className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] rounded-sm border border-fn-green/30 bg-fn-card p-3 shadow-2xl shadow-black/70"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-fn-gborder pb-2">
              <div>
                <p className="fn-label text-fn-green">Menu</p>
                <p className="mt-1 text-[9px] text-fn-muted">Quick actions and upcoming feature destinations.</p>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-fn-muted hover:text-fn-text">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-1.5">
              {PENDING_MENU_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled
                  title="Pending destination confirmation"
                  className="flex items-center justify-between rounded-sm border border-fn-gborder bg-fn-dark px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-fn-muted opacity-70"
                >
                  {item}<span className="text-[8px]">TBD</span>
                </button>
              ))}
              <Link href="/search" className="flex items-center justify-between rounded-sm border border-fn-green/30 bg-fn-green/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-fn-green hover:bg-fn-green/20">
                <span className="flex items-center gap-2"><Search size={12} /> Search</span><ChevronRight size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setLoadCodeOpen((current) => !current)}
                aria-expanded={loadCodeOpen}
                className="flex items-center justify-between rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-fn-yellow hover:bg-fn-yellow/20"
              >
                <span className="flex items-center gap-2"><Ticket size={12} /> Load Code</span><ChevronRight size={12} />
              </button>
            </div>

            {loadCodeOpen && (
              <form onSubmit={(event) => { event.preventDefault(); submitBookingCode(); }} className="mt-2 rounded-sm border border-fn-gborder bg-fn-black/80 p-2">
                <label className="fn-label" htmlFor="bottom-nav-booking-code">Booking code</label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="bottom-nav-booking-code"
                    value={bookingCode}
                    onChange={(event) => setBookingCode(event.target.value)}
                    placeholder="Enter code"
                    className="min-w-0 flex-1 rounded-sm border border-fn-gborder bg-fn-dark px-2 py-2 text-[10px] text-fn-text outline-none focus:border-fn-green/60"
                  />
                  <button type="submit" className="fn-btn px-3 py-2 text-[9px]">Load</button>
                </div>
              </form>
            )}

            <p className="mt-2 text-[8px] leading-relaxed text-fn-muted">
              Virtual, Casino, Games, and Fantasy League remain placeholders until their destinations are confirmed.
            </p>
          </section>
        </div>
      )}

      <nav
        aria-label="Primary mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-fn-gborder bg-fn-dark/95 px-2 pt-1.5 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <div className="grid grid-cols-5 items-end gap-1">
          {NAV_ITEMS.map((item) => {
            const { label, icon: Icon, match } = item;
            const isMenu = label === "Menu";
            const isActive = isMenu ? menuOpen || match(pathname) : match(pathname);
            const isWager = label === "Wager";
            const content = (
              <>
                <span
                  className={`absolute top-0 h-0.5 w-7 rounded-full transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}
                  style={{ background: isActive ? "rgb(var(--fn-text))" : "transparent" }}
                />
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isWager && wagerCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-fn-black bg-fn-red px-1 text-[9px] font-black leading-none text-white">
                      {wagerCount > 99 ? "99+" : wagerCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </>
            );

            if (isMenu) {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  aria-expanded={menuOpen}
                  className={navItemClass(isActive)}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={"href" in item ? item.href : "/"}
                aria-current={isActive ? "page" : undefined}
                className={navItemClass(isActive)}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
