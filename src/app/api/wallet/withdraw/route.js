import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { submitWithdrawal } from '@/features/withdrawals/server';

export const dynamic = 'force-dynamic';

// Legacy endpoint retained for callers that have not migrated to /api/withdraw.
// It now creates the same manual-review request and never initiates a Paystack transfer.
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { amount } = await request.json();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });
    }
    return NextResponse.json(await submitWithdrawal(user.id, { amount: numericAmount }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
