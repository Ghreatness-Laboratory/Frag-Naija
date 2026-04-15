import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/server';
import { getWalletTransactions } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '10');

    const transactions = await getWalletTransactions(user.id, {
      limit: Number.isNaN(limit) ? 10 : Math.min(Math.max(limit, 1), 50),
    });

    return NextResponse.json(transactions);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
