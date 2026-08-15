'use client';

import Link from 'next/link';
import { Gamepad2, Lock } from 'lucide-react';

const MODES = [
  { key: 'tdm_1v1', label: 'TDM 1V1', ready: true, href: '/games/tdm-1v1' },
  { key: 'wow_team_4v4', label: 'WOW MODE Team 4v4' },
  { key: 'wow_team_3v3', label: 'WOW MODE Team 3v3' },
  { key: 'wow_team_2v3', label: 'WOW MODE Team 2v3' },
  { key: 'wow_player_4v4', label: 'WOW MODE Player 4v4' },
  { key: 'wow_player_2v2', label: 'WOW MODE Player 2v2' },
  { key: 'wow_player_3v3', label: 'WOW MODE Player 3v3' },
];

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-fn-black px-4 py-8 text-fn-text">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="fn-label text-fn-green">Games</p>
          <h1 className="text-2xl font-black uppercase tracking-widest">Choose Mode</h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-fn-muted">
            TDM 1V1 is live as the first playable mode. WOW Mode variants remain visible for the roadmap and will unlock later.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => {
            const className = `rounded border p-4 text-left transition-all ${
              mode.ready
                ? 'border-fn-green/40 bg-fn-green/10 hover:bg-fn-green/20 hover:shadow-[0_0_24px_rgba(0,255,65,0.14)]'
                : 'border-fn-gborder bg-fn-card opacity-60'
            }`;
            const content = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black uppercase tracking-wider">{mode.label}</span>
                  {mode.ready ? <Gamepad2 className="shrink-0 text-fn-green" /> : <Lock className="shrink-0 text-fn-muted" />}
                </div>
                <p className="mt-2 text-xs text-fn-muted">{mode.ready ? 'Enter character select' : 'Coming Soon'}</p>
              </>
            );

            return mode.ready && mode.href ? (
              <Link key={mode.key} href={mode.href} className={className}>
                {content}
              </Link>
            ) : (
              <button key={mode.key} type="button" disabled className={className}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
