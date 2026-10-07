import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { setTournamentNotificationSubscription } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { tournament_id, subscribed } = await request.json().catch(() => ({}));
  if (!tournament_id) return NextResponse.json({ error: 'tournament_id is required' }, { status: 400 });
  try {
    return NextResponse.json(await setTournamentNotificationSubscription(user.id, tournament_id, subscribed !== false));
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to update tournament alert subscription.' }, { status: 400 });
  }
}
