import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { listTournamentMatches, upsertTournamentMatchState } from '@/features/notifications/server';

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

export async function POST(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await upsertTournamentMatchState({
      tournament_id: body.tournament_id,
      source_id: body.source_id,
      match_title: body.match_title,
      team_a: body.team_a,
      team_b: body.team_b,
      starts_at: body.starts_at,
      status: body.status,
    });
    return NextResponse.json(result.match, { status: body.source_id ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to save tournament match.' }, { status: 400 });
  }
}
