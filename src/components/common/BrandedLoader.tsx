'use client';

import { motion, useReducedMotion } from 'framer-motion';

type BrandedLoaderProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
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
        className={`font-display font-black tracking-widest ${sizeClasses[size]}`}
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
        <span className="text-fn-green">FRAG</span>{' '}<span className="text-fn-text">NAIJA</span>
      </motion.div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
