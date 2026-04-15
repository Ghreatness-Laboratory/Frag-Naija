import { NextResponse } from 'next/server';
import { settleWager } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { outcome } = await request.json();
    if (!outcome || typeof outcome !== 'string' || !outcome.trim()) {
      return NextResponse.json({ error: 'outcome is required' }, { status: 400 });
    }
    const result = await settleWager(params.id, outcome.trim());
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
