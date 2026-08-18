import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { setMatchNotificationSubscription } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { match_result_id, tournament_match_id, subscribed } = await request.json().catch(() => ({}));
  if (!match_result_id && !tournament_match_id) return NextResponse.json({ error: 'match_result_id or tournament_match_id is required' }, { status: 400 });
  try {
    const result = await setMatchNotificationSubscription(user.id, match_result_id || null, subscribed !== false, tournament_match_id || null);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to update match alert subscription.' }, { status: 400 });
  }
}
