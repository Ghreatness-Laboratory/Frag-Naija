import { NextResponse } from 'next/server';
import { getAthletes, createAthlete } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      team:   searchParams.get('team')   || '',
      status: searchParams.get('status') || '',
    };
    const data = await getAthletes(filters);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await createAthlete(body);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
