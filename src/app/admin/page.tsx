'use client';

import Link from 'next/link';
import { Users, Shield, ArrowLeftRight, Trophy, Swords, Film, ChevronRight, Banknote } from 'lucide-react';

const SECTIONS = [
  { href: '/admin/athletes',    icon: Users,          label: 'Athletes',    desc: 'Add players, update stats & photos',  color: 'text-fn-green' },
  { href: '/admin/teams',       icon: Shield,         label: 'Teams',       desc: 'Create and manage esports teams',      color: 'text-fn-yellow' },
  { href: '/admin/transfers',   icon: ArrowLeftRight, label: 'Transfers',   desc: 'Post rumours and confirmed moves',      color: 'text-fn-pink' },
  { href: '/admin/tournaments', icon: Trophy,         label: 'Tournaments', desc: 'Schedule and update tournaments',       color: 'text-fn-amber' },
  { href: '/admin/wagers',      icon: Swords,         label: 'Wagers',      desc: 'Create markets, toggle hot, settle',   color: 'text-fn-red' },
  { href: '/admin/highlights',  icon: Film,           label: 'Highlights',  desc: 'Upload clips and Theatre of War vids', color: 'text-fn-gdim' },
  { href: '/admin/finance',     icon: Banknote,       label: 'Finance',     desc: 'Transactions, settings, manual credit', color: 'text-fn-green' },
];

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fn-text tracking-widest uppercase">Dashboard</h1>
        <p className="text-fn-muted text-sm mt-1">Select a section to manage content</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group bg-fn-card border border-fn-gborder rounded-lg p-5 hover:border-fn-green/40 hover:bg-fn-card2 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className={`w-6 h-6 ${color}`} />
              <ChevronRight className="w-4 h-4 text-fn-muted group-hover:text-fn-green transition-colors" />
            </div>
            <p className="text-fn-text font-bold text-sm uppercase tracking-wide">{label}</p>
            <p className="text-fn-muted text-xs mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
