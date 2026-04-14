'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Shield, ArrowLeftRight,
  Trophy, Swords, Film, LogOut, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/admin',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/athletes',    label: 'Athletes',    icon: Users },
  { href: '/admin/teams',       label: 'Teams',       icon: Shield },
  { href: '/admin/transfers',   label: 'Transfers',   icon: ArrowLeftRight },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/admin/wagers',      label: 'Wagers',      icon: Swords },
  { href: '/admin/highlights',  label: 'Highlights',  icon: Film },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {});
    document.cookie = 'admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-fn-black flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-fn-dark border-r border-fn-gborder flex flex-col">
        <div className="p-4 border-b border-fn-gborder">
          <p className="text-fn-green font-bold text-sm tracking-widest uppercase">FRAG NAIJA</p>
          <p className="text-fn-muted text-xs">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  active
                    ? 'bg-fn-green/10 text-fn-green border border-fn-green/20'
                    : 'text-fn-muted hover:bg-fn-card hover:text-fn-text'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-fn-gborder">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm text-fn-muted hover:text-fn-red hover:bg-fn-red/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
