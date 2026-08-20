import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { addFeaturedAthlete, getFeaturedAthletes, reorderFeaturedAthletes } from '@/features/featuredAthletes.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getFeaturedAthletes());
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    if (Array.isArray(body.ids)) return NextResponse.json(await reorderFeaturedAthletes(body.ids));
    return NextResponse.json(await addFeaturedAthlete(body.athlete_id), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
