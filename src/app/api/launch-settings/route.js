import { NextResponse } from 'next/server';
import { getSetting } from '@/features/settings/server';

export const dynamic = 'force-dynamic';

function defaultLaunchTarget() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET() {
  const configuredTarget = await getSetting('launch_countdown_target');
  const target = configuredTarget || process.env.LAUNCH_COUNTDOWN_TARGET || defaultLaunchTarget();

  return NextResponse.json({
    mode: process.env.SITE_LAUNCH_MODE || 'live',
    launch_countdown_target: target,
    auto_launch: false,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
