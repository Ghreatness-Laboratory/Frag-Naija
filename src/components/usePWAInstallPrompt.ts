'use client';

import { useEffect, useRef, useState } from 'react';

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

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isUnsupportedInstallBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('firefox') || ua.includes('opera mini') || ua.includes('opr/');
}

export function usePWAInstallPrompt() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPromptReady, setDeferredPromptReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setIsStandalone(isStandaloneDisplayMode());

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');

    const hideInstallAction = () => {
      deferredPromptRef.current = null;
      setDeferredPromptReady(false);
      setIsStandalone(true);
    };

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) hideInstallAction();
      else setIsStandalone(isStandaloneDisplayMode());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setDeferredPromptReady(true);
      setIsStandalone(false);
    };

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
    if (isStandaloneDisplayMode()) {
      setIsStandalone(true);
      return { status: 'installed' as const, message: 'FragNaija is already installed.' };
    }

    const prompt = deferredPromptRef.current;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      deferredPromptRef.current = null;
      setDeferredPromptReady(false);
      return { status: choice.outcome as 'accepted' | 'dismissed', message: choice.outcome === 'accepted' ? 'Install started.' : 'Install dismissed.' };
    }

    if (isIOS()) {
      return { status: 'manual' as const, message: 'On iPhone or iPad, tap Share, then Add to Home Screen.' };
    }

    if (isUnsupportedInstallBrowser()) {
      return { status: 'unsupported' as const, message: "Your browser doesn't support direct app installation. Switch to Chrome, Edge, or Safari to install FragNaija." };
    }

    return { status: 'waiting' as const, message: 'Install support is still loading. If no prompt appears, use Chrome or Edge and try again.' };
  }

  return {
    install,
    deferredPromptReady,
    installable: hydrated ? !isStandalone : true,
    isStandalone,
    hydrated,
  };
}
