'use client';

import Link from 'next/link';
import { Users, Shield, ArrowLeftRight, Trophy, Swords, Film, ChevronRight, Banknote } from 'lucide-react';
import { GAMES } from '@/lib/games';

const SECTIONS = [
  { href: '/admin/athletes',    icon: Users,          label: 'Athletes',    desc: 'Add players, update stats & photos'   },
  { href: '/admin/teams',       icon: Shield,         label: 'Teams',       desc: 'Create and manage esports teams'       },
  { href: '/admin/transfers',   icon: ArrowLeftRight, label: 'Transfers',   desc: 'Post rumours and confirmed moves'       },
  { href: '/admin/tournaments', icon: Trophy,         label: 'Tournaments', desc: 'Schedule and update tournaments'        },
  { href: '/admin/wagers',      icon: Swords,         label: 'Wagers',      desc: 'Create markets, toggle hot, settle'    },
  { href: '/admin/highlights',  icon: Film,           label: 'Highlights',  desc: 'Upload clips and Theatre of War vids'  },
  { href: '/admin/finance',     icon: Banknote,       label: 'Finance',     desc: 'Transactions, settings, manual credit' },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-fn-text tracking-widest uppercase">Dashboard</h1>
        <p className="text-fn-muted text-sm mt-1">Manage content by game or browse all sections</p>
      </div>

      {/* ── Game hubs ─────────────────────────────────────────────── */}
      <section>
        <p className="text-fn-muted text-xs uppercase tracking-widest mb-3">Edit by Game</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {GAMES.map((game) => (
            <div
              key={game.slug}
              className="rounded-sm border p-4 space-y-3"
              style={{ borderColor: `${game.colors.primary}30`, background: game.colors.cardBg }}
            >
              {/* Logo / initial */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center text-[11px] font-black border flex-shrink-0"
                  style={{ borderColor: `${game.colors.primary}40`, color: game.colors.primary, background: `${game.colors.primary}15` }}
                >
                  {game.shortName.slice(0, 2)}
                </div>
                <span className="text-[11px] font-bold text-fn-text leading-tight">{game.shortName}</span>
              </div>

              {/* Quick-links into each section pre-filtered */}
              <div className="space-y-1">
                {[
                  { label: 'Tournaments', href: `/admin/tournaments?game=${game.slug}` },
                  { label: 'Athletes',    href: `/admin/athletes?game=${game.slug}` },
                  { label: 'Teams',       href: `/admin/teams?game=${game.slug}` },
                  { label: 'Transfers',   href: `/admin/transfers?game=${game.slug}` },
                  { label: 'Highlights',  href: `/admin/highlights?game=${game.slug}` },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase px-2 py-1.5 rounded-sm transition-all"
                    style={{ color: game.colors.primary }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${game.colors.primary}15`)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {label}
                    <ChevronRight size={10} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── All sections ──────────────────────────────────────────── */}
      <section>
        <p className="text-fn-muted text-xs uppercase tracking-widest mb-3">All Sections</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group bg-fn-card border border-fn-gborder rounded-lg p-5 hover:border-fn-green/40 hover:bg-fn-card2 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-6 h-6 text-fn-green" />
                <ChevronRight className="w-4 h-4 text-fn-muted group-hover:text-fn-green transition-colors" />
              </div>
              <p className="text-fn-text font-bold text-sm uppercase tracking-wide">{label}</p>
              <p className="text-fn-muted text-xs mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
