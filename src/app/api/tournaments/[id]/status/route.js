import { NextResponse } from 'next/server';
import { updateTournamentStatus } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }
    const data = await updateTournamentStatus(params.id, status);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
