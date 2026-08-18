'use client';

import { useEffect, useState } from 'react';

export type PWAInstallMode = 'native' | 'ios' | 'unsupported';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function detectFallbackMode(): PWAInstallMode | null {
  if (typeof navigator === 'undefined') return null;

  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isFirefox = /firefox|fxios/.test(userAgent);
  const isOperaMini = /opera mini|opios/.test(userAgent);

  if (isIOS) return 'ios';
  if (isFirefox || isOperaMini) return 'unsupported';
  return null;
}

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installMode, setInstallMode] = useState<PWAInstallMode | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode()) return;

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');

    const hideInstallAction = () => {
      setDeferredPrompt(null);
      setInstallMode(null);
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) hideInstallAction();
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallMode('native');
    };

    setInstallMode(detectFallbackMode());
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', hideInstallAction);
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', hideInstallAction);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallMode(null);
  }

  return { install, installMode, installable: installMode !== null };
}
