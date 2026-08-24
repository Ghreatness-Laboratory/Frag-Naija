import { NextResponse } from 'next/server';
import { dispatchStartingSoonMatchAlerts } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

function isAuthorized(request) {
  const secret = process.env.SUPABASE_MATCH_ALERT_SCHEDULER_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await dispatchStartingSoonMatchAlerts());
  } catch (error) {
    console.error('Supabase match-alert scheduler failed:', error);
    return NextResponse.json({ error: 'Unable to dispatch match-starting alerts.' }, { status: 500 });
  }
}
