import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  transferWindow: { gameSlug: 'pubg-mobile', status: 'closed', transfersRemaining: 0, opens: '', closes: '' },
  chipWindows: {
    triple_captain: { status: 'closed', opens: '', closes: '' },
    manual_substitute: { status: 'closed', opens: '', closes: '' },
  },
};

async function getSetting(key, fallback) {
  const { data, error } = await supabaseAdmin.from('fantasy_settings').select('value').eq('key', key).maybeSingle();
  if (error && error.code !== '42P01') throw error;
  return data?.value ?? fallback;
}

export async function GET() {
  try {
    const [transferWindow, chipWindows] = await Promise.all([
      getSetting('pubg_transfer_window', DEFAULT_SETTINGS.transferWindow),
      getSetting('pubg_chip_windows', DEFAULT_SETTINGS.chipWindows),
    ]);
    return NextResponse.json({ transferWindow, chipWindows });
  } catch (error) {
    return NextResponse.json({ ...DEFAULT_SETTINGS, warning: error.message || 'Using default fantasy settings.' });
  }
}
