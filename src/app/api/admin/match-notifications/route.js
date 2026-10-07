import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { createManualMatchUpdateNotification } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await createManualMatchUpdateNotification(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to send match update.' }, { status: 400 });
  }
}
