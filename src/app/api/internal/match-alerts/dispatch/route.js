import { NextResponse } from 'next/server';
import { dispatchStartingSoonMatchAlerts } from '@/features/notifications/server';
export const dynamic = 'force-dynamic';
function isAuthorized(request) {
  const secret = process.env.SUPABASE_MATCH_ALERT_SCHEDULER_SECRET;
  const received = request.headers.get('authorization');
  console.log('DEBUG auth check:', {
    secretExists: Boolean(secret),
    secretLength: secret?.length ?? 0,
    receivedExists: Boolean(received),
    receivedLength: received?.length ?? 0,
    receivedPrefix: received?.slice(0, 10) ?? null,
    matches: received === `Bearer ${secret}`,
  });
  return Boolean(secret) && received === `Bearer ${secret}`;
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
