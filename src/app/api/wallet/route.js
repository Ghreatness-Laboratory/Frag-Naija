import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getUserTransactions } from '@/features/deposits/server';
import { getUserWagers, getWallet } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [wallet, deposits, bets] = await Promise.all([
      getWallet(user.id).catch(() => null),
      getUserTransactions(user.id).catch(() => []),
      getUserWagers(user.id).catch(() => []),
    ]);

    // Merge into a unified timeline sorted by date descending
    const history = [
      ...deposits.map((t) => ({
        id:          t.id,
        date:        t.created_at,
        type:        t.type,        // deposit | credit | debit
        description: t.type === 'deposit' ? 'Wallet deposit' : t.note || (t.type === 'credit' ? 'Admin credit' : 'Admin debit'),
        amount:      Number(t.amount_credited),
        status:      t.status,
        reference:   t.reference,
      })),
      ...bets.map((b) => ({
        id:          b.id,
        date:        b.created_at,
        type:        b.status === 'Won' ? 'winnings' : b.status === 'Refunded' ? 'refund' : 'bet',
        description: b.wager?.question || 'Wager bet',
        amount:      b.status === 'Won' ? Number(b.potential) : b.status === 'Refunded' ? Number(b.amount) : -Number(b.amount),
        status:      b.status.toLowerCase(),
        reference:   b.reference,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ wallet, history });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
