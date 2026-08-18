import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getNotificationSettings, saveNotificationSettings } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ match_results_enabled: true, authenticated: false });
  const settings = await getNotificationSettings(user.id);
  return NextResponse.json({ ...settings, authenticated: true });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const settings = await saveNotificationSettings(user.id, body);
  return NextResponse.json(settings);
}
