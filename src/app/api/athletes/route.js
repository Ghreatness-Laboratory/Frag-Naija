import { NextResponse } from 'next/server';
import { getAthletes, getAthleteRoles, createAthlete } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const game_slug = searchParams.get('game_slug') || '';

    if (searchParams.get('distinct') === 'roles') {
      const roles = await getAthleteRoles({ game_slug });
      return NextResponse.json(roles);
    }

    const filters = {
      team:   searchParams.get('team')   || '',
      status: searchParams.get('status') || '',
      game_slug,
      is_icon: searchParams.get('is_icon') || '',
    };
    const data = await getAthletes(filters);
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/athletes failed', {
      game_slug: searchParams.get('game_slug'),
      team: searchParams.get('team'),
      status: searchParams.get('status'),
      is_icon: searchParams.get('is_icon'),
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createAthlete(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
