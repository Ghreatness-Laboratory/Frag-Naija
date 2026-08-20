export type LaunchRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

export type LaunchSettings = {
  launch_countdown_target?: string | null;
  auto_launch?: boolean;
};

export function fallbackLaunchTarget() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function getLaunchRemaining(target: string): LaunchRemaining {
  const delta = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(delta / 86_400_000),
    hours: Math.floor((delta % 86_400_000) / 3_600_000),
    minutes: Math.floor((delta % 3_600_000) / 60_000),
    seconds: Math.floor((delta % 60_000) / 1000),
    complete: delta <= 0,
  };
}

export function formatLaunchRemaining(remaining: LaunchRemaining) {
  return `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`;
}
