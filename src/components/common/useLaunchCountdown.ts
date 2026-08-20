'use client';

import { useEffect, useMemo, useState } from 'react';
import { fallbackLaunchTarget, getLaunchRemaining, type LaunchSettings } from '@/lib/launchCountdown';

export function useLaunchCountdown() {
  const [target, setTarget] = useState(fallbackLaunchTarget);
  const [remaining, setRemaining] = useState(() => getLaunchRemaining(target));

  useEffect(() => {
    fetch('/api/launch-settings', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: LaunchSettings | null) => {
        if (settings?.launch_countdown_target) setTarget(settings.launch_countdown_target);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setRemaining(getLaunchRemaining(target));
    const timer = window.setInterval(() => setRemaining(getLaunchRemaining(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const targetLabel = useMemo(() => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(target)), [target]);

  return { target, targetLabel, remaining };
}
