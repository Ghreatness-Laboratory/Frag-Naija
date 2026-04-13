import { NextResponse } from 'next/server';
import { settleWager } from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function PATCH(request, { params }) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { outcome } = await request.json();
    if (!outcome || !['YES', 'NO'].includes(outcome)) {
      return NextResponse.json({ error: 'outcome must be YES or NO' }, { status: 400 });
    }
    const result = await settleWager(params.id, outcome);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
