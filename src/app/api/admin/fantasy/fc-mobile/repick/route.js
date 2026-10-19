import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST() {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  const now = new Date().toISOString();
  const transferWindow = {
    gameSlug: 'fc-mobile',
    status: 'open',
    transfersRemaining: 6,
    opens: now,
    closes: '',
  };

  const upserts = [
    { key: 'fc_mobile_allow_repick', value: true, updated_at: now },
    { key: 'fc_mobile_reset_at', value: now, updated_at: now },
    { key: 'fc_mobile_transfer_window', value: transferWindow, updated_at: now },
  ];

  const { error: settingsError } = await supabaseAdmin
    .from('fantasy_settings')
    .upsert(upserts, { onConflict: 'key' });

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  // Clear existing FC Mobile squads in database so managers start fresh
  const { error: squadsError } = await supabaseAdmin
    .from('fantasy_squads')
    .delete()
    .eq('game_slug', 'fc-mobile');

  if (squadsError) {
    console.warn('[Admin FC Mobile Repick] Note on squads reset:', squadsError.message);
  }

  return NextResponse.json({
    success: true,
    message: 'FC Mobile fantasy re-pick enabled for all managers. Squads reset.',
    reset_at: now,
    transferWindow,
    allow_repick: true,
  });
}

export async function GET() {
  try {
    const { data: repickData } = await supabaseAdmin
      .from('fantasy_settings')
      .select('value')
      .eq('key', 'fc_mobile_allow_repick')
      .maybeSingle();

    const { data: resetData } = await supabaseAdmin
      .from('fantasy_settings')
      .select('value')
      .eq('key', 'fc_mobile_reset_at')
      .maybeSingle();

    const { data: windowData } = await supabaseAdmin
      .from('fantasy_settings')
      .select('value')
      .eq('key', 'fc_mobile_transfer_window')
      .maybeSingle();

    return NextResponse.json({
      allow_repick: repickData?.value ?? true,
      reset_at: resetData?.value ?? null,
      transferWindow: windowData?.value ?? { status: 'open', transfersRemaining: 6 },
    });
  } catch (err) {
    return NextResponse.json({
      allow_repick: true,
      reset_at: null,
      transferWindow: { status: 'open', transfersRemaining: 6 },
      error: err.message,
    });
  }
}
