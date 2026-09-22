'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';
import { usePWAInstallPrompt } from '@/components/usePWAInstallPrompt';

const DISMISSED_KEY = 'fn-pwa-dismissed';

export default function PWAInstallPrompt() {
  const { deferredPromptReady, install, isIOS, isStandalone, hydrated } = usePWAInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hydrated || isStandalone || localStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS) {
      const timer = window.setTimeout(() => setVisible(true), 3000);
      return () => window.clearTimeout(timer);
    }

    if (deferredPromptReady) setVisible(true);
  }, [deferredPromptReady, hydrated, isIOS, isStandalone]);

  async function handleInstall() {
    const result = await install();
    if (result.status === 'accepted' || result.status === 'installed') setVisible(false);
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (!visible || isStandalone) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[300] animate-slide-u sm:left-auto sm:right-4 sm:w-80"
      role="dialog"
      aria-label="Install Frag Naija app"
    >
      <div
        className="overflow-hidden rounded-sm border border-fn-green/30 bg-fn-card shadow-2xl"
        style={{ boxShadow: '0 0 24px rgba(0,255,65,0.12)' }}
      >
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Smartphone size={12} className="text-fn-green" />
            <span className="fn-label text-fn-text">Install App</span>
          </div>
          <button onClick={dismiss} aria-label="Dismiss" className="text-fn-muted transition-colors hover:text-fn-text">
            <X size={13} />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-black">
              <OptimizedImage src="/therealfavicon.png" alt="Frag Naija" width={48} height={48} sizes="48px" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-fn-text">Frag Naija</p>
              <p className="text-[9px] leading-snug text-fn-muted">
                {isIOS ? 'Add to Home Screen for the full app experience' : 'Install for faster access — works offline too'}
              </p>
            </div>
          </div>
          {isIOS ? (
            <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[9px] leading-relaxed text-fn-muted">
              Tap <strong className="text-fn-text">Share</strong> (<span className="font-bold text-fn-green">&#x2B06;</span>) then{' '}
              <strong className="text-fn-text">&quot;Add to Home Screen&quot;</strong>
            </div>
          ) : (
            <button type="button" onClick={handleInstall} className="fn-btn flex w-full items-center justify-center gap-2 py-2.5 text-[10px]">
              <Download size={11} /> INSTALL APP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
