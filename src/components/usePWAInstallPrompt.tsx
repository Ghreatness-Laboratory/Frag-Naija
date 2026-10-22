'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, AlertCircle } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PWAInstallContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  // Backwards compatibility aliases
  install: () => Promise<{ status: string; message: string }>;
  deferredPromptReady: boolean;
  installable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  hydrated: boolean;
  openIOSModal: () => void;
  closeIOSModal: () => void;
  isIOSModalOpen: boolean;
};

const PWAInstallPromptContext = createContext<PWAInstallContextValue | null>(null);

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
    document.referrer.includes('android-app://')
  );
}

function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isIpadOS = navigator.maxTouchPoints > 1 && navigator.platform === 'MacIntel';
  return /iphone|ipad|ipod/.test(ua) || isIpadOS;
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPromptReady, setDeferredPromptReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  useEffect(() => {
    setHydrated(true);
    const iOS = isIOSDevice();
    const standalone = isStandaloneDisplayMode();
    setIsIOS(iOS);
    setIsInstalled(standalone);

    // Track when user enters/leaves standalone mode
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPromptReady(false);
        deferredPromptRef.current = null;
      }
    };

    // Single source of truth for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setDeferredPromptReady(true);
      setIsInstalled(false);
      console.log('[PWA] beforeinstallprompt event captured');
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setDeferredPromptReady(false);
      setIsInstalled(true);
      setIsIOSModalOpen(false);
      setToastMessage(null);
      console.log('[PWA] appinstalled event fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayChange);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const promptInstall = async () => {
    if (isStandaloneDisplayMode()) {
      setIsInstalled(true);
      showToast('FragNaija is already installed on your device.');
      return;
    }

    // 1. Native deferred prompt (Chrome, Edge, Chromium)
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        deferredPromptRef.current = null;
        setDeferredPromptReady(false);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn('[PWA] Install prompt failed:', err);
      }
      return;
    }

    // 2. iOS Safari (manual Add to Home Screen flow)
    if (isIOS) {
      setIsIOSModalOpen(true);
      return;
    }

    // 3. Browser without native prompt support (Firefox, Safari on desktop, etc.)
    showToast("Install isn't available in this browser. Try Chrome or Edge.");
  };

  const install = async () => {
    await promptInstall();
    return {
      status: isInstalled ? 'installed' : deferredPromptReady ? 'prompted' : isIOS ? 'manual' : 'unsupported',
      message: isInstalled ? 'Installed' : 'Prompt displayed',
    };
  };

  // canInstall is true if not yet running in standalone mode
  const canInstall = hydrated && !isInstalled;

  return (
    <PWAInstallPromptContext.Provider
      value={{
        canInstall,
        isInstalled,
        promptInstall,
        install,
        deferredPromptReady,
        installable: canInstall,
        isStandalone: isInstalled,
        isIOS,
        hydrated,
        openIOSModal: () => setIsIOSModalOpen(true),
        closeIOSModal: () => setIsIOSModalOpen(false),
        isIOSModalOpen,
      }}
    >
      {children}

      {/* iOS Installation Instructions Modal */}
      {isIOSModalOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-sm border border-fn-green/40 bg-fn-card p-6 shadow-2xl">
            <button
              onClick={() => setIsIOSModalOpen(false)}
              className="absolute right-3 top-3 text-fn-muted hover:text-fn-text transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-fn-gborder pb-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-dark">
                <OptimizedImage
                  src="/icons/icon-192.png"
                  alt="FragNaija Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-display text-base font-black uppercase tracking-wider text-fn-text">
                  Install FragNaija
                </h3>
                <p className="text-[10px] text-fn-muted">iOS Safari Installation</p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-fn-text">
              <p className="text-[11px] leading-relaxed text-fn-muted">
                Follow these simple steps in Safari to add FragNaija to your Home Screen:
              </p>

              <div className="flex items-start gap-3 rounded-sm border border-fn-gborder bg-fn-dark/60 p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fn-green/20 text-[10px] font-black text-fn-green">
                  1
                </span>
                <div className="text-[11px] leading-snug">
                  Tap the <strong className="text-fn-green">Share</strong> button{' '}
                  <Share size={12} className="inline text-fn-green mx-0.5" /> in the Safari toolbar (at the bottom or top).
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-fn-gborder bg-fn-dark/60 p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fn-green/20 text-[10px] font-black text-fn-green">
                  2
                </span>
                <div className="text-[11px] leading-snug">
                  Scroll down the share sheet and tap{' '}
                  <strong className="text-fn-green">Add to Home Screen</strong>{' '}
                  <PlusSquare size={12} className="inline text-fn-green mx-0.5" />.
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-sm border border-fn-gborder bg-fn-dark/60 p-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fn-green/20 text-[10px] font-black text-fn-green">
                  3
                </span>
                <div className="text-[11px] leading-snug">
                  Tap <strong className="text-fn-green">Add</strong> in the top-right corner.
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsIOSModalOpen(false)}
              className="fn-btn mt-5 w-full py-2.5 text-xs uppercase tracking-widest"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Browser Support / Informational Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-[350] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slide-u">
          <div className="flex items-center justify-between gap-3 rounded-sm border border-fn-green/40 bg-fn-card p-3.5 shadow-2xl shadow-fn-green/10">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-fn-yellow" />
              <p className="text-xs font-semibold text-fn-text">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-fn-muted hover:text-fn-text transition-colors"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </PWAInstallPromptContext.Provider>
  );
}

export function usePWAInstallPrompt() {
  const context = useContext(PWAInstallPromptContext);
  if (!context) {
    throw new Error('usePWAInstallPrompt must be used inside PWAInstallProvider.');
  }
  return context;
}
