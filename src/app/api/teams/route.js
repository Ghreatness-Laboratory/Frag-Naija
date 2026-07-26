import { NextResponse } from 'next/server';
import { getTeams, createTeam } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';
import { requireGameSlug } from '@/lib/game-scope';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = requireGameSlug(searchParams);
    const data = await getTeams({ gameSlug });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createTeam(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
