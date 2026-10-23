import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const athleteId = String(body.athlete_id || '').trim();
  const points = Number(body.points);
  const mode = body.mode === 'set' ? 'set' : 'add';

  if (!athleteId) {
    return NextResponse.json({ error: 'athlete_id is required.' }, { status: 400 });
  }

  if (!Number.isFinite(points)) {
    return NextResponse.json({ error: 'points must be a valid number.' }, { status: 400 });
  }

  const { data: athlete, error: fetchError } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single();

  if (fetchError || !athlete) {
    return NextResponse.json({ error: 'Athlete not found.' }, { status: 404 });
  }

  const existingTotal = Number(athlete.total_fantasy_points) || 0;
  const newRecent = points;
  const newTotal = mode === 'set' ? points : Math.max(0, existingTotal + points);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('athletes')
    .update({
      recent_fantasy_points: newRecent,
      total_fantasy_points: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', athleteId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    athlete: updated,
    pointsAwarded: points,
    newRecent,
    newTotal,
  });
}
