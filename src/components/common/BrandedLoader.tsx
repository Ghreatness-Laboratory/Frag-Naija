'use client';

import { motion, useReducedMotion } from 'framer-motion';

type BrandedLoaderProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export default function BrandedLoader({ label = 'Loading', size = 'md', className = '' }: BrandedLoaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-center ${className}`} role="status" aria-live="polite">
      <motion.div
        className={`relative ${sizeClasses[size]}`}
        animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], filter: ['drop-shadow(0 0 0 rgba(0,255,65,0))', 'drop-shadow(0 0 14px rgba(0,255,65,0.55))', 'drop-shadow(0 0 0 rgba(0,255,65,0))'] }}
        transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src="/logo-icon.jpeg" alt="" className="h-full w-full rounded-sm border border-fn-green/30 object-cover" />
        <span className="absolute inset-0 rounded-sm border border-fn-green/40" />
      </motion.div>
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-fn-muted">{label}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
