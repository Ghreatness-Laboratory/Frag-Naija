import { NextResponse } from 'next/server';
import { getTeamById, updateTeam, deleteTeam } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';
import { requireGameSlug } from '@/lib/game-scope';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getTeamById(params.id, { gameSlug: requireGameSlug(searchParams) });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await updateTeam(params.id, body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteTeam(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
