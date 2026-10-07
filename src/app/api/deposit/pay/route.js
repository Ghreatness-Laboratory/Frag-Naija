import { NextResponse } from 'next/server';
import { initializeTransaction, generateReference } from '@/lib/paystack';
import { getCurrentUser } from '@/features/auth/server';
import { getSetting } from '@/features/settings/server';
import { MIN_DEPOSIT_NGN } from '@/features/wagers/constants';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to deposit' }, { status: 401 });
    }

    const depositsEnabled = await getSetting('deposits_enabled');
    if (depositsEnabled === 'false') {
      return NextResponse.json({ error: 'Deposits are currently disabled' }, { status: 503 });
    }

    const { amount } = await request.json();
    const configuredMinimum = Number(await getSetting('min_deposit_ngn'));
    // The setting can increase the minimum, but never reduce the application floor.
    const minDeposit = Math.max(MIN_DEPOSIT_NGN, Number.isFinite(configuredMinimum) ? configuredMinimum : MIN_DEPOSIT_NGN);
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < minDeposit) {
      return NextResponse.json({ error: `Minimum deposit is ₦${minDeposit.toLocaleString()}` }, { status: 400 });
    }

    const reference = generateReference('DEP');

    const result = await initializeTransaction({
      email:        user.email,
      amount:       numericAmount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/wallet?status=success&tab=deposit`,
      metadata: {
        payment_type: 'deposit',
        user_id:      user.id,
        custom_fields: [
          { display_name: 'Payment Type', variable_name: 'payment_type', value: 'Wallet Deposit' },
        ],
      },
    });

    if (!result.status) {
      return NextResponse.json({ error: result.message || 'Payment initialisation failed' }, { status: 502 });
    }

    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference:         result.data.reference,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
