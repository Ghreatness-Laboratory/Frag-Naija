import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getUserWithdrawals, submitWithdrawal } from '@/features/withdrawals/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const withdrawals = await getUserWithdrawals(user.id);
    return NextResponse.json(withdrawals);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });
    }

    const result = await submitWithdrawal(user.id, { amount: Number(amount) });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
