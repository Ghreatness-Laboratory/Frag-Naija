'use client';

import Link from 'next/link';
import { Newspaper, ShieldCheck, TimerReset } from 'lucide-react';
import { useLaunchCountdown } from '@/components/common/useLaunchCountdown';

function CountdownCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-fn-green/25 bg-fn-black/70 p-3 text-center shadow-[0_0_24px_rgba(77,255,110,.08)]">
      <div className="font-display text-3xl font-black tabular-nums text-fn-green sm:text-5xl">{String(value).padStart(2, '0')}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-fn-muted">{label}</div>
    </div>
  );
}

export default function ComingSoonPage() {
  const { targetLabel, remaining } = useLaunchCountdown();

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-fn-black px-4 py-12 text-fn-text sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,255,110,.18),transparent_38%),linear-gradient(135deg,rgba(0,200,255,.08),transparent_42%)]" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-sm border border-fn-green/30 bg-fn-green/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-fn-green">
          <ShieldCheck size={13} /> Admin preview open · Public launch pending
        </div>
        <h1 className="font-display text-4xl font-black uppercase tracking-widest text-fn-text sm:text-6xl">FragNaija</h1>
        <p className="mt-3 text-sm font-black uppercase tracking-[0.35em] text-fn-green">Everything Esports - One Platform</p>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-fn-muted sm:text-base">
          We are tuning the arena before public launch. Until then, News is open for public access while the full platform remains available only to admin accounts.
        </p>

        <div className="mt-8 w-full max-w-3xl rounded-sm border border-fn-gborder bg-fn-card/80 p-4 backdrop-blur sm:p-6">
          <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-fn-muted">
            <TimerReset size={14} className="text-fn-green" /> Countdown to launch window
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <CountdownCell label="Days" value={remaining.days} />
            <CountdownCell label="Hours" value={remaining.hours} />
            <CountdownCell label="Mins" value={remaining.minutes} />
            <CountdownCell label="Secs" value={remaining.seconds} />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-fn-muted">
            Target: {targetLabel}. {remaining.complete ? 'Launching now — manual admin toggle still required.' : 'Manual admin toggle required to open the full site.'}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/news" className="inline-flex items-center gap-2 rounded-sm bg-fn-green px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-black transition-transform hover:-translate-y-0.5">
            <Newspaper size={15} /> Enter News
          </Link>
          <Link href="/admin/login" className="inline-flex items-center gap-2 rounded-sm border border-fn-green/40 px-5 py-3 text-xs font-black uppercase tracking-widest text-fn-green transition-colors hover:bg-fn-green/10">
            Admin Login
          </Link>
        </div>
      </div>
    </section>
  );
}
