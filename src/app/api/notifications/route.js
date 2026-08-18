import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { listGamingAlerts, listGamingTracker, listGamingNotifications, getUnreadCount } from '@/features/notifications/server';
import { getTournaments } from '@/features/tournaments/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const tracker = await listGamingTracker({ userId: user?.id, tournamentId: searchParams.get('tournament') || '', gameSlug: searchParams.get('game') || '', status: searchParams.get('status') || '' });
    const alerts = await listGamingAlerts({ userId: user?.id, tournamentId: searchParams.get('tournament') || '', gameSlug: searchParams.get('game') || '' });
    const notifications = await listGamingNotifications({ userId: user?.id, tournamentId: searchParams.get('tournament') || '', gameSlug: searchParams.get('game') || '' });
    const unreadCount = user ? await getUnreadCount(user.id) : 0;
    const tournaments = tracker.tournaments.length ? tracker.tournaments : await getTournaments({});
    return NextResponse.json({ alerts, notifications, unreadCount, tournaments: tournaments.filter((t) => ['live', 'upcoming', 'finished', 'completed'].includes(String(t.display_status || t.status).toLowerCase())), matches: tracker.matches });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
