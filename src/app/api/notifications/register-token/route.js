import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { registerFcmToken } from '@/features/notifications/server';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { token } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
  const row = await registerFcmToken(user.id, token);
  return NextResponse.json(row);
}
