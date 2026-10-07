import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/features/auth/server';
import { getUserTransactions } from '@/features/deposits/server';
import { getUserWagers, getWallet, getWalletTransactions } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [wallet, deposits, bets, walletTransactions] = await Promise.all([
      getWallet(user.id).catch((error) => {
        console.error('Wallet API wallet lookup failed', { userId: user.id, message: error?.message });
        return null;
      }),
      getUserTransactions(user.id).catch(() => []),
      getUserWagers(user.id).catch(() => []),
      getWalletTransactions(user.id, { limit: 100 }).catch(() => []),
    ]);

    // Merge into a unified timeline sorted by date descending
    const betIdsWithWalletTransactions = new Set(walletTransactions.map((tx) => String(tx.bet_id || '')).filter(Boolean));
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
      ...walletTransactions.map((tx) => ({
        id:          tx.id,
        date:        tx.created_at,
        type:        tx.type === 'Payout' ? 'winnings' : tx.type === 'Refund' ? 'refund' : tx.type === 'Stake' ? 'bet' : String(tx.type || '').toLowerCase(),
        description: tx.description || 'Wallet transaction',
        amount:      Number(tx.amount || 0),
        status:      'completed',
        reference:   tx.bet_id || tx.wager_id || tx.id,
      })),
      ...bets.filter((b) => !betIdsWithWalletTransactions.has(String(b.id))).map((b) => ({
        id:          b.id,
        date:        b.created_at,
        type:        b.status === 'Won' ? 'winnings' : b.status === 'Refunded' ? 'refund' : 'bet',
        description: b.wager?.question || 'Wager bet',
        amount:      b.status === 'Won' ? Number(b.potential) : b.status === 'Refunded' ? Number(b.amount) : -Number(b.amount),
        status:      b.status.toLowerCase(),
        reference:   b.reference,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ wallet, history }, { headers: NO_STORE_HEADERS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
