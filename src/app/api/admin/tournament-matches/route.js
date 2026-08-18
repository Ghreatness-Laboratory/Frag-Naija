import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { listTournamentMatches } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { searchParams } = new URL(request.url);
    const matches = await listTournamentMatches({ tournamentId: searchParams.get('tournament') || '' });
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to load tournament matches.' }, { status: 500 });
  }
}
