'use client';

import { motion, useReducedMotion } from 'framer-motion';

type RouteLoadingScreenProps = {
  subtitle?: string;
  ariaLabel?: string;
  reduceMotion?: boolean;
  loaderKey?: string;
};

export default function RouteLoadingScreen({
  subtitle = 'LOADING',
  ariaLabel,
  reduceMotion: reduceMotionOverride,
  loaderKey = 'route-loader',
}: RouteLoadingScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = reduceMotionOverride ?? Boolean(prefersReducedMotion);

  return (
    <motion.section
      key={loaderKey}
      initial={reduceMotion ? false : { opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.32 }}
      className="fixed inset-0 z-40 flex min-h-screen items-center justify-center bg-[#080a07] text-fn-text"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel ?? subtitle}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={reduceMotion ? undefined : {
            textShadow: [
              '0 0 10px rgba(77,255,110,0.28)',
              '0 0 24px rgba(77,255,110,0.62)',
              '0 0 10px rgba(77,255,110,0.28)',
            ],
          }}
          transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          <span className="font-display text-3xl font-black tracking-widest text-fn-green glow-text sm:text-5xl">FRAG</span>
          <span className="font-display text-3xl font-black tracking-widest text-fn-text sm:text-5xl">NAIJA</span>
        </motion.div>
        <div className="mt-5 h-px w-48 overflow-hidden bg-fn-green/15 sm:w-64">
          {reduceMotion ? (
            <span className="block h-full w-full bg-fn-green/80 shadow-[0_0_16px_rgba(77,255,110,0.85)]" />
          ) : (
            <motion.span
              className="block h-full w-1/2 bg-fn-green shadow-[0_0_16px_rgba(77,255,110,0.85)]"
              initial={{ x: '-100%' }}
              animate={{ x: ['-100%', '220%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-fn-muted">{subtitle}</p>
      </div>
    </motion.section>
  );
}
