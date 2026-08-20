import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { removeFeaturedAthlete } from '@/features/featuredAthletes.server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    await removeFeaturedAthlete(params.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
