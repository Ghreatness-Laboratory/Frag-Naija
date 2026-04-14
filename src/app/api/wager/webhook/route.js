import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createWagerBet, getUserIdByEmail } from '@/features/wagers/server';
import { processDeposit } from '@/features/deposits/server';

export async function POST(request) {
  try {
    const rawBody   = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const { reference, metadata, amount, customer } = event.data;
    const amountNGN = amount / 100; // kobo → naira

    // Route by payment_type: 'deposit' goes to wallet, everything else is a wager bet
    if (metadata?.payment_type === 'deposit') {
      const userId = metadata.user_id;
      if (!userId) {
        console.error('Deposit webhook missing user_id in metadata', { reference });
        return NextResponse.json({ received: true });
      }
      await processDeposit({ reference, userId, amountPaid: amountNGN });
      return NextResponse.json({ received: true });
    }

    // Wager bet (legacy flow — no payment_type in metadata)
    const { wager_id, selection, potential } = metadata;
    const email   = customer.email;
    const user_id = await getUserIdByEmail(email);

    await createWagerBet({
      wager_id,
      user_id,
      email,
      selection,
      amount:    amountNGN,
      potential: Number(potential),
      reference,
    });

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
