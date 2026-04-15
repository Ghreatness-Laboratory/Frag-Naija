import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/checkAdmin';
import { getAllWithdrawals } from '@/features/withdrawals/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authErr = await checkAdmin();
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const withdrawals = await getAllWithdrawals({ status });
    return NextResponse.json(withdrawals);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
