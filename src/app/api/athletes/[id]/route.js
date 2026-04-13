import { NextResponse } from 'next/server';
import { getAthleteById, updateAthlete, deleteAthlete } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request, { params }) {
  try {
    const data = await getAthleteById(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const data = await updateAthlete(params.id, body);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteAthlete(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
