import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

const FC_FIELDS = ['appearance_points', 'goal_points', 'win_points', 'loss_points', 'conceded_points'];
export async function GET() {
  const unauthorized = await checkAdmin(); if (unauthorized) return unauthorized;
  const { data, error } = await supabaseAdmin.from('fantasy_scoring_config').select('*').eq('game_slug', 'fc-mobile').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
export async function PUT(request) {
  const unauthorized = await checkAdmin(); if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => ({}));
  const config = { game_slug: 'fc-mobile', name: 'FC Mobile default', updated_at: new Date().toISOString() };
  for (const field of FC_FIELDS) { const value = Number(body[field]); if (!Number.isFinite(value)) return NextResponse.json({ error: `${field} must be numeric.` }, { status: 400 }); config[field] = value; }
  const { data, error } = await supabaseAdmin.from('fantasy_scoring_config').upsert(config, { onConflict: 'game_slug' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
