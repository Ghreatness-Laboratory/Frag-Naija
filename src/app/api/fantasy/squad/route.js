import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

function sanitizeIds(value) {
  return Array.isArray(value) ? value.map((id) => String(id)).filter(Boolean) : [];
}

function squadPayload(body = {}) {
  const starter_ids = sanitizeIds(body.starters ?? body.starter_ids).slice(0, 4);
  const bench_ids = sanitizeIds(body.bench ?? body.bench_ids).slice(0, 2);
  const captain_id = body.captain || body.captain_id || null;
  const selected = [...starter_ids, ...bench_ids];
  return {
    starter_ids,
    bench_ids,
    captain_id: captain_id && selected.includes(String(captain_id)) ? captain_id : null,
    squad_value: Number(body.squad_value) || 0,
    remaining_budget: Number(body.remaining_budget) || 10000000,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ squad: null }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('fantasy_squads')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ squad: data });
}

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const payload = { ...squadPayload(body), user_id: user.id };
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('fantasy_squads')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const query = existing?.id
    ? supabaseAdmin.from('fantasy_squads').update(payload).eq('id', existing.id)
    : supabaseAdmin.from('fantasy_squads').insert([payload]);
  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ squad: data });
}
