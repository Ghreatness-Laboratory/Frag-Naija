import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { markNotificationsRead } from '@/features/notifications/server';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { ids } = await request.json().catch(() => ({}));
  return NextResponse.json(await markNotificationsRead(user.id, Array.isArray(ids) ? ids : []));
}
