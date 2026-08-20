"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, ChevronRight, Sun, Moon, LogOut, Wallet, Shield, ShieldCheck, Gamepad2, Bell, Settings } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useGame } from "@/context/GameContext";
import DisclaimerModal from "@/components/DisclaimerModal";
import { useNotifications } from "@/components/notifications/NotificationsProvider";

const navLinks = [
  { label: "Home",            href: "/" },
  { label: "Tournaments",     href: "/tournaments" },
  { label: "Athletes",        href: "/athletes" },
  { label: "Teams",           href: "/teams" },
  { label: "Organizations",   href: "/organizations" },
  { label: "Transfer Window", href: "/transfer-window" },
  { label: "Communities",     href: "/communities" },
  { label: "Shop",            href: "/shop" },
  { label: "Highlights",      href: "/highlights" },
];

function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      className={`w-8 h-8 flex items-center justify-center border border-fn-gborder text-fn-muted hover:text-fn-green hover:border-fn-green/50 rounded-sm transition-all ${className}`}
    >
      {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  );
}

type MeUser = { username?: string; email: string } | null;

function useAuthState() {
  const [user,    setUser]    = useState<MeUser | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    
    Promise.all([
      fetch("/api/auth/me", { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/auth/admin/check", { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([userData, adminData]) => {
      if (!active) return;
      setUser(userData ?? null);
      setIsAdmin(adminData?.isAdmin ?? false);
    });
    
    return () => { active = false; };
  }, []);

  return { user, isAdmin };
}

function GameSwitcher({ onClick }: { onClick: () => void }) {
  const { selectedGame, isHydrated } = useGame();
  if (!isHydrated) return null;
  return (
    <button
      onClick={onClick}
      title="Switch game"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-fn-gborder bg-fn-card hover:border-fn-green/40 transition-all group"
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={selectedGame
          ? { background: selectedGame.colors.primary, boxShadow: `0 0 6px ${selectedGame.colors.primary}` }
          : { background: 'rgb(var(--fn-muted))' }}
      />
      <span className="text-[9px] font-bold uppercase tracking-widest text-fn-text group-hover:text-fn-green transition-colors truncate max-w-[80px]">
        {selectedGame?.shortName ?? 'All Games'}
      </span>
      <Gamepad2 size={10} className="text-fn-muted group-hover:text-fn-green transition-colors flex-shrink-0" />
    </button>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const path            = usePathname();
  const router          = useRouter();
  const { user, isAdmin } = useAuthState();
  const { selectedGame, isHydrated } = useGame();
  const { unreadCount } = useNotifications();

  const displayName = user?.username || user?.email?.split("@")[0];

  function goToGameSelect() {
    setOpen(false);
    router.push('/select-game');
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      <DisclaimerModal />
      <nav className="fixed left-0 right-0 top-0 z-50 flex min-h-14 items-center border-b border-fn-gborder bg-fn-dark px-3 sm:px-6" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-1.5 border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none sm:mr-6 [&_span]:border-none [&_span]:outline-none">
          <span className="font-display text-lg sm:text-xl font-black text-fn-green tracking-widest glow-text">FRAG</span>
          <span className="font-display text-lg sm:text-xl font-black text-fn-text tracking-widest">NAIJA</span>
        </Link>

        {/* Game switcher — desktop */}
        <div className="hidden lg:block mr-3">
          <GameSwitcher onClick={goToGameSelect} />
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all rounded-sm ${
                path === l.href
                  ? "text-fn-green bg-fn-green/10 border border-fn-gborder"
                  : "text-fn-muted hover:text-fn-text hover:bg-fn-card"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop: actions */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <Link
            href="/wager"
            className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-all rounded-sm ${
              path === "/wager"
                ? "text-fn-yellow bg-fn-yellow/10 border border-fn-yellow/30"
                : "text-fn-amber hover:text-fn-yellow hover:bg-fn-yellow/10 border border-transparent"
            }`}
          >
            ⚡ WAGER
          </Link>
          <ThemeToggle />
          <Link
            href="/gaming-alerts"
            aria-label="Open FragNaija Gaming Alerts"
            className={`relative flex h-8 w-8 items-center justify-center border rounded-sm transition-all ${
              path === "/gaming-alerts"
                ? "border-fn-green/40 bg-fn-green/10 text-fn-green"
                : "border-fn-gborder text-fn-muted hover:border-fn-green/50 hover:text-fn-green"
            }`}
          >
            <Bell size={13} />
            {unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-fn-black bg-fn-red px-1 text-[8px] font-black leading-none text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>

          {!user && (
            <Link href="/login" className="inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap border border-fn-green bg-fn-green px-3 py-1.5 text-[10px] font-black uppercase leading-none tracking-widest text-fn-black hover:bg-fn-gdim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green">
              Login / Sign Up
            </Link>
          )}

          {user && (
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-fn-green/10 border border-fn-green/30 text-fn-green rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-fn-green/20 transition-all"
                >
                  <Shield size={10} /> Admin
                </Link>
              )}
              <Link
                href="/wallet"
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${
                  path === "/wallet"
                    ? "text-fn-green bg-fn-green/10 border-fn-green/30"
                    : "text-fn-muted border-fn-gborder hover:text-fn-green hover:border-fn-green/30"
                }`}
              >
                <Wallet size={10} /> Wallet
              </Link>
              <Link
                href="/settings"
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${
                  path === "/settings"
                    ? "text-fn-green bg-fn-green/10 border-fn-green/30"
                    : "text-fn-muted border-fn-gborder hover:text-fn-green hover:border-fn-green/30"
                }`}
              >
                <Settings size={10} /> Settings
              </Link>
              <Link
                href="/security"
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all ${
                  path === "/security"
                    ? "text-fn-green bg-fn-green/10 border-fn-green/30"
                    : "text-fn-muted border-fn-gborder hover:text-fn-green hover:border-fn-green/30"
                }`}
              >
                <ShieldCheck size={10} /> Security
              </Link>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-fn-card border border-fn-gborder rounded-sm">
                <User size={11} className="text-fn-green" />
                <span className="text-[10px] text-fn-text font-bold uppercase tracking-wider truncate max-w-[100px]">
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="w-8 h-8 flex items-center justify-center border border-fn-gborder text-fn-muted hover:text-fn-red hover:border-fn-red/50 rounded-sm transition-all"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile: actions */}
        <div className="flex items-center gap-2 ml-auto lg:hidden">
          <Link href="/wager" className="text-fn-amber text-[9px] font-bold tracking-widest uppercase border border-fn-amber/30 px-2.5 py-1 rounded-sm">
            ⚡
          </Link>
          <ThemeToggle />
          <Link href="/gaming-alerts" aria-label="Open FragNaija Gaming Alerts" className="relative flex h-8 w-8 items-center justify-center border border-fn-gborder text-fn-muted hover:text-fn-green"><Bell size={14} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fn-red px-1 text-[8px] font-black text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
          {!user && (
            <Link href="/login" className="inline-flex h-8 max-w-[72px] shrink-0 items-center justify-center whitespace-nowrap border border-fn-green bg-fn-green px-2.5 py-1 text-[9px] font-black uppercase leading-none tracking-widest text-fn-black hover:bg-fn-gdim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green">
              Login
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-fn-muted hover:text-fn-green transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 bottom-0 w-72 bg-fn-dark border-l border-fn-gborder flex flex-col animate-slide-u" style={{ top: 'calc(3.5rem + env(safe-area-inset-top))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-fn-gborder">
              <div className="fn-label mb-1">Navigation</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <User size={13} className={user ? "text-fn-green" : "text-fn-muted"} />
                  <span className="text-[10px] text-fn-muted">
                    {user ? displayName : "Not logged in"}
                  </span>
                </div>
                <ThemeToggle />
              </div>
              {/* Game switcher — mobile */}
              {isHydrated && (
                <button
                  onClick={goToGameSelect}
                  className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-sm border border-fn-gborder bg-fn-dark hover:border-fn-green/40 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={selectedGame
                        ? { background: selectedGame.colors.primary, boxShadow: `0 0 6px ${selectedGame.colors.primary}` }
                        : { background: 'rgb(var(--fn-muted))' }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-fn-text">
                      {selectedGame?.shortName ?? 'All Games'}
                    </span>
                    <span className="text-[8px] text-fn-muted uppercase tracking-wider">{selectedGame ? '— Active Game' : '— Neutral'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] text-fn-muted">
                    <Gamepad2 size={10} /> Switch
                  </div>
                </button>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {[...navLinks, { label: "⚡ Wager Zone", href: "/wager" }].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-3 py-3 mb-1 rounded-sm text-[11px] font-bold tracking-wider uppercase transition-all ${
                    path === l.href
                      ? "text-fn-green bg-fn-green/10 border border-fn-gborder"
                      : "text-fn-muted hover:text-fn-text hover:bg-fn-card"
                  }`}
                >
                  {l.label}
                  <ChevronRight size={12} />
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/wallet"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 mb-1 rounded-sm text-[11px] font-bold tracking-wider uppercase transition-all ${
                      path === "/wallet"
                        ? "text-fn-green bg-fn-green/10 border border-fn-gborder"
                        : "text-fn-muted hover:text-fn-text hover:bg-fn-card"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Wallet size={12} /> Wallet</span>
                    <ChevronRight size={12} />
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 mb-1 rounded-sm text-[11px] font-bold tracking-wider uppercase transition-all ${
                      path === "/settings"
                        ? "text-fn-green bg-fn-green/10 border border-fn-gborder"
                        : "text-fn-muted hover:text-fn-text hover:bg-fn-card"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Settings size={12} /> Settings</span>
                    <ChevronRight size={12} />
                  </Link>
                  <Link
                    href="/security"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 mb-1 rounded-sm text-[11px] font-bold tracking-wider uppercase transition-all ${
                      path === "/security"
                        ? "text-fn-green bg-fn-green/10 border border-fn-gborder"
                        : "text-fn-muted hover:text-fn-text hover:bg-fn-card"
                    }`}
                  >
                    <span className="flex items-center gap-2"><ShieldCheck size={12} /> Security</span>
                    <ChevronRight size={12} />
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-3 mb-1 rounded-sm text-[11px] font-bold tracking-wider uppercase text-fn-green bg-fn-green/10 border border-fn-green/20 transition-all"
                >
                  <span className="flex items-center gap-2"><Shield size={12} /> Admin Panel</span>
                  <ChevronRight size={12} />
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-fn-gborder flex gap-2">
              {user ? (
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="flex-1 fn-btn-outline text-[10px] py-2 flex items-center justify-center gap-1.5"
                >
                  <LogOut size={12} /> Logout
                </button>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1 fn-btn text-[10px] py-2 text-center">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
