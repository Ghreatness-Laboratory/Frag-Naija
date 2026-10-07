import { NextResponse } from 'next/server';
import { getTournamentResults, createTournamentResult } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json(await getTournamentResults({ game_slug: searchParams.get('game_slug') || '' }));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try { return NextResponse.json(await createTournamentResult(await request.json()), { status: 201 }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
