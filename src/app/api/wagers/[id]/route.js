import { NextResponse } from 'next/server';
import { getWagerById, deleteWager } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET(request, { params }) {
  try {
    const data = await getWagerById(params.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 404 });
  }
}

export async function DELETE(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    await deleteWager(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
