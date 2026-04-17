'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'fn-pwa-dismissed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Detect if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

    setIsIOS(ios);
    setIsStandalone(standalone);

    if (standalone || localStorage.getItem(DISMISSED_KEY)) return;

    if (ios) {
      // Show iOS-specific install hint after a short delay
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
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
      <div className="overflow-hidden rounded-sm border border-fn-green/30 bg-fn-card shadow-2xl"
        style={{ boxShadow: '0 0 24px rgba(0,255,65,0.12)' }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Smartphone size={12} className="text-fn-green" />
            <span className="fn-label text-fn-text">Install App</span>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-fn-muted hover:text-fn-text transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {/* App icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-sm border border-fn-green/30 bg-fn-green/10">
              <span className="font-display text-base font-black text-fn-green glow-text">FN</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-fn-text">Frag Naija</p>
              <p className="text-[9px] text-fn-muted leading-snug">
                {isIOS
                  ? 'Add to Home Screen for the full app experience'
                  : 'Install for faster access — works offline too'}
              </p>
            </div>
          </div>

          {isIOS ? (
            /* iOS manual install instruction */
            <div className="rounded-sm border border-fn-gborder bg-fn-dark p-3 text-[9px] text-fn-muted leading-relaxed">
              Tap <strong className="text-fn-text">Share</strong> (
              <span className="font-bold text-fn-green">⬆</span>) then{' '}
              <strong className="text-fn-text">"Add to Home Screen"</strong>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="fn-btn flex w-full items-center justify-center gap-2 py-2.5 text-[10px]"
            >
              <Download size={11} /> INSTALL APP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
