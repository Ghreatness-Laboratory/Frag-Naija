import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { getCurrentUser } from '@/features/auth/server';
import { processDeposit } from '@/features/deposits/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { reference } = await request.json();
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const result = await verifyTransaction(reference);
    if (!result?.status) {
      return NextResponse.json({ error: result?.message || 'Unable to verify payment' }, { status: 502 });
    }

    const tx = result.data;
    if (tx?.status !== 'success') {
      return NextResponse.json({ verified: false, status: tx?.status || 'unknown' }, { status: 202 });
    }

    if (tx?.metadata?.payment_type !== 'deposit') {
      return NextResponse.json({ error: 'Payment reference is not a wallet deposit' }, { status: 400 });
    }

    if (tx?.metadata?.user_id !== user.id) {
      console.error('Deposit verification user mismatch', {
        reference,
        currentUserId: user.id,
        paymentUserId: tx?.metadata?.user_id,
      });
      return NextResponse.json({ error: 'Payment reference does not belong to this user' }, { status: 403 });
    }

    const amountPaid = Number(tx.amount) / 100;
    const deposit = await processDeposit({ reference: tx.reference || reference, userId: user.id, amountPaid });

    return NextResponse.json({ verified: true, deposit });
  } catch (e) {
    console.error('Deposit verification error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
