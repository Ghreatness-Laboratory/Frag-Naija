'use client';

import { Download } from 'lucide-react';
import { usePWAInstallPrompt } from './usePWAInstallPrompt';

export default function PWAInstallButton({ className = '' }: { className?: string }) {
  const { install, installable } = usePWAInstallPrompt();

  return (
    <button
      type="button"
      onClick={install}
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm border border-fn-green/30 bg-fn-green/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fn-green transition-all hover:bg-fn-green/20 ${className}`}
    >
      <Download size={11} /> Install App
    </button>
  );
}
