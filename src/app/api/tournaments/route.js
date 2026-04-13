import { NextResponse } from 'next/server';
import { getTournaments, createTournament } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = { status: searchParams.get('status') || '' };
    const data = await getTournaments(filters);
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
    const data = await createTournament(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
