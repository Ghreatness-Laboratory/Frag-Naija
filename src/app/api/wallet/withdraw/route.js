import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { processWithdrawal } from '@/features/wagers/server';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { amount, account_number, bank_code, name } = await request.json();

    if (!amount || !account_number || !bank_code || !name) {
      return NextResponse.json(
        { error: 'amount, account_number, bank_code, and name are required' },
        { status: 400 }
      );
    }

    const result = await processWithdrawal(user.id, {
      amount: Number(amount),
      account_number,
      bank_code,
      name,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
