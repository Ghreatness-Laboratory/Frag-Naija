import { NextResponse } from 'next/server';
import { dispatchStartingSoonMatchAlerts } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await dispatchStartingSoonMatchAlerts());
  } catch (error) {
    console.error('Match-alert cron failed:', error);
    return NextResponse.json({ error: 'Unable to dispatch match-starting alerts.' }, { status: 500 });
  }
}
