import { NextResponse } from 'next/server';
import { getTeams, createTeam, replaceTeamGallery } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getTeams({ game_slug: searchParams.get('game_slug') || '' });
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
    const { gallery, ...teamBody } = body;
    const data = await createTeam(teamBody);
    if (Array.isArray(gallery)) data.gallery = await replaceTeamGallery(data.id, gallery);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
