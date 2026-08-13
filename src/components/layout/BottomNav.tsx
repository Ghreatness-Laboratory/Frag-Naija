"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Shield, Target, User } from "lucide-react";
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
  { label: "Search", href: "/search", icon: Search, match: (path: string) => path.startsWith("/search") },
  { label: "Athletes", href: "/athletes", icon: User, match: (path: string) => path.startsWith("/athletes") },
  { label: "Teams", href: "/teams", icon: Shield, match: (path: string) => path.startsWith("/teams") },
  { label: "Wager", href: "/wager", icon: Target, match: (path: string) => path.startsWith("/wager") },
];

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
  const [wagerCount, setWagerCount] = useState(0);

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

  if (HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-fn-gborder bg-fn-dark/95 px-2 pt-1.5 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] backdrop-blur md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      <div className="grid grid-cols-5 items-end gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, match }) => {
          const isActive = match(pathname);
          const isWager = label === "Wager";

          return (
            <Link
              key={label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1 text-[9px] font-black uppercase tracking-[0.08em] transition-colors ${
                isActive ? "text-fn-text" : "text-fn-muted hover:text-fn-green"
              }`}
            >
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
