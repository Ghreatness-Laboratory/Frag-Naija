import { NextResponse } from 'next/server';
import { checkAdmin } from '@/features/shared/server/adminAuth';
import { createMatchResultAlert, listGamingAlerts } from '@/features/notifications/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;
  return NextResponse.json(await listGamingAlerts({}));
}

export async function POST(request) {
  const unauthorized = await checkAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json().catch(() => ({}));
    for (const key of ['tournament_id', 'source_id', 'match_title', 'winner_name', 'mvp_name', 'placement_3_name', 'placement_4_name']) {
      if (!String(body[key] || '').trim()) return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
    const result = await createMatchResultAlert({ ...body, source_type: 'tournament_match' });
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to finalize result.' }, { status: 500 });
  }
}
