"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User, ChevronRight, Sun, Moon, LogOut, Wallet, Shield, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import DisclaimerModal from "@/components/DisclaimerModal";

const navLinks = [
  { label: "Home",            href: "/" },
  { label: "Tournaments",     href: "/tournaments" },
  { label: "Athletes",        href: "/athletes" },
  { label: "Teams",           href: "/teams" },
  { label: "Transfer Window", href: "/transfer-window" },
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
    Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/auth/admin/check").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([userData, adminData]) => {
      setUser(userData ?? null);
      setIsAdmin(adminData?.isAdmin ?? false);
    });
  }, []);

  return { user, isAdmin };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const path            = usePathname();
  const { user, isAdmin } = useAuthState();

  const displayName = user?.username || user?.email?.split("@")[0];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <>
      <DisclaimerModal />
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-fn-dark border-b border-fn-gborder flex items-center px-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 mr-6 shrink-0">
          <span className="font-display text-lg sm:text-xl font-black text-fn-green tracking-widest glow-text">FRAG</span>
          <span className="font-display text-lg sm:text-xl font-black text-fn-text tracking-widest">NAIJA</span>
        </Link>

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

          {user === null && (
            <>
              <Link href="/login" className="text-fn-muted hover:text-fn-text text-[10px] tracking-widest uppercase transition-colors">
                Login
              </Link>
              <Link href="/register" className="fn-btn text-[10px] px-3 py-1.5">
                Sign Up
              </Link>
            </>
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
            className="absolute top-14 right-0 bottom-0 w-72 bg-fn-dark border-l border-fn-gborder flex flex-col animate-slide-u"
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
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex-1 fn-btn-outline text-[10px] py-2 text-center">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="flex-1 fn-btn text-[10px] py-2 text-center">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
