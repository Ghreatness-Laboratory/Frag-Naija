import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { listGamingAlerts, getUnreadCount } from '@/features/notifications/server';
import { getTournaments } from '@/features/tournaments/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const alerts = await listGamingAlerts({ userId: user?.id, tournamentId: searchParams.get('tournament') || '', gameSlug: searchParams.get('game') || '' });
    const unreadCount = user ? await getUnreadCount(user.id) : 0;
    const tournaments = await getTournaments({});
    return NextResponse.json({ alerts, unreadCount, tournaments: tournaments.filter((t) => ['live', 'upcoming', 'completed'].includes(String(t.status).toLowerCase())) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
