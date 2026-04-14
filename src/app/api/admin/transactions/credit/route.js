import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { manualWalletAdjustment } from '@/features/deposits/server';

export async function POST(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { userId, amount, type, note } = await request.json();

    if (!userId || !amount || !type || !note) {
      return NextResponse.json({ error: 'userId, amount, type, and note are required' }, { status: 400 });
    }

    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json({ error: 'type must be credit or debit' }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 });
    }

    const result = await manualWalletAdjustment({ userId, amount: Number(amount), type, note });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
