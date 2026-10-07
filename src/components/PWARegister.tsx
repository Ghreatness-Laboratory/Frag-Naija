'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        const safelyUpdate = () => {
          if (!registration.active && !registration.waiting && !registration.installing) return;
          registration.update().catch((err) => {
            console.warn('[SW] Update check failed:', err);
          });
        };

        // Check for updates every time the page becomes visible, without surfacing
        // transient InvalidStateError exceptions to users.
        safelyUpdate();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') safelyUpdate();
        });
      })
      .catch((err) => {
        // SW registration is non-critical — fail silently
        console.warn('[SW] Registration failed:', err);
      });
  }, []);

  return null;
}
