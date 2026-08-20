'use client';

import { motion, useReducedMotion } from 'framer-motion';

type BrandedLoaderProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

const scanTransition = {
  duration: 1.45,
  repeat: Infinity,
  ease: 'linear' as const,
};

const glowTransition = {
  duration: 1.45,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

export default function BrandedLoader({ label = 'Loading', size = 'md', className = '' }: BrandedLoaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-live="polite" aria-label={label}>
      <motion.div
        className={`relative isolate overflow-hidden rounded-sm border border-fn-green/35 bg-fn-black ${sizeClasses[size]}`}
        animate={reduceMotion ? undefined : {
          boxShadow: [
            '0 0 10px rgba(0,255,65,0.18), 0 0 0 rgba(0,255,65,0)',
            '0 0 22px rgba(0,255,65,0.5), 0 0 38px rgba(0,255,65,0.2)',
            '0 0 10px rgba(0,255,65,0.18), 0 0 0 rgba(0,255,65,0)',
          ],
          scale: [1, 1.025, 1],
        }}
        transition={reduceMotion ? undefined : glowTransition}
      >
        <img src="/logo-icon.jpeg" alt="" className="h-full w-full object-cover" aria-hidden="true" />
        <span className="pointer-events-none absolute inset-0 rounded-sm border border-fn-green/25" />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.12),transparent_62%)] mix-blend-screen" />
        {reduceMotion ? (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-fn-green/70 shadow-[0_0_12px_rgba(0,255,65,0.65)]" />
        ) : (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -left-2 -right-2 h-4 bg-gradient-to-b from-transparent via-fn-green/85 to-transparent opacity-90 shadow-[0_0_18px_rgba(0,255,65,0.85)]"
            initial={{ y: '-120%' }}
            animate={{ y: ['-120%', '720%'] }}
            transition={scanTransition}
          />
        )}
      </motion.div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
