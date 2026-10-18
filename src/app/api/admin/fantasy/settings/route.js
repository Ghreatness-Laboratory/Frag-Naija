import { NextResponse } from 'next/server';

import { checkAdmin } from '@/features/shared/server/adminAuth';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

const ALLOWED_TRANSFER_STATUSES = new Set(['open', 'closed', 'scheduled']);
const ALLOWED_CHIP_STATUSES = new Set(['open', 'closed', 'scheduled']);

function cleanWindow(value = {}, fallbackStatus = 'closed') {
  const status = ALLOWED_TRANSFER_STATUSES.has(value.status) || ALLOWED_CHIP_STATUSES.has(value.status) ? value.status : fallbackStatus;
  return { status, opens: value.opens || '', closes: value.closes || '' };
}

export async function PUT(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const gameSlug = body.gameSlug || body.transferWindow?.gameSlug || 'pubg-mobile';
  const prefix = gameSlug.replace(/-/g, '_');

  const transferWindow = {
    gameSlug,
    ...cleanWindow(body.transferWindow, 'closed'),
    transfersRemaining: Math.max(0, Number(body.transferWindow?.transfersRemaining) || 0),
  };
  const chipWindows = {
    triple_captain: cleanWindow(body.chipWindows?.triple_captain, 'closed'),
    manual_substitute: cleanWindow(body.chipWindows?.manual_substitute, 'closed'),
  };

  const upserts = [
    { key: `${prefix}_transfer_window`, value: transferWindow, updated_at: new Date().toISOString() },
    { key: `${prefix}_chip_windows`, value: chipWindows, updated_at: new Date().toISOString() },
  ];

  if (body.budget !== undefined && Number(body.budget) > 0) {
    upserts.push({ key: `${prefix}_budget`, value: Number(body.budget), updated_at: new Date().toISOString() });
  }

  const { error } = await supabaseAdmin.from('fantasy_settings').upsert(upserts, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gameSlug, transferWindow, chipWindows, budget: body.budget });
}
