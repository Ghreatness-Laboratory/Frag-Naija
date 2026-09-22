'use client';

import { createContext, createElement, ReactNode, useContext, useEffect, useRef, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallResult = {
  status: 'accepted' | 'dismissed' | 'installed' | 'manual' | 'unsupported' | 'waiting';
  message: string;
};

type PWAInstallPromptContextValue = {
  install: () => Promise<InstallResult>;
  deferredPromptReady: boolean;
  installable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  hydrated: boolean;
};

const PWAInstallPromptContext = createContext<PWAInstallPromptContextValue | null>(null);

function isStandaloneDisplayMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIOSBrowser() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isUnsupportedInstallBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('firefox') || ua.includes('opera mini') || ua.includes('opr/');
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [deferredPromptReady, setDeferredPromptReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setIsIOS(isIOSBrowser());
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

  async function install(): Promise<InstallResult> {
    if (isStandaloneDisplayMode()) {
      setIsStandalone(true);
      return { status: 'installed', message: 'FragNaija is already installed.' };
    }

    const prompt = deferredPromptRef.current;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      deferredPromptRef.current = null;
      setDeferredPromptReady(false);
      return { status: choice.outcome, message: choice.outcome === 'accepted' ? 'Install started.' : 'Install dismissed.' };
    }

    if (isIOSBrowser()) {
      return { status: 'manual', message: 'On iPhone or iPad, tap Share, then Add to Home Screen.' };
    }

    if (isUnsupportedInstallBrowser()) {
      return { status: 'unsupported', message: "Your browser doesn't support direct app installation. Switch to Chrome, Edge, or Safari to install FragNaija." };
    }

    return { status: 'waiting', message: 'Install support is still loading. If no prompt appears, use Chrome or Edge and try again.' };
  }

  return createElement(
    PWAInstallPromptContext.Provider,
    { value: { install, deferredPromptReady, installable: hydrated ? !isStandalone : true, isStandalone, isIOS, hydrated } },
    children,
  );
}

export function usePWAInstallPrompt() {
  const context = useContext(PWAInstallPromptContext);
  if (!context) throw new Error('usePWAInstallPrompt must be used inside PWAInstallProvider.');
  return context;
}
