import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createWagerBet, getUserIdByEmail } from '@/features/wagers/server';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const { reference, metadata, amount, customer } = event.data;
    const { wager_id, selection, potential } = metadata;
    const email = customer.email;

    const user_id = await getUserIdByEmail(email);

    const amountNGN = amount / 100; // kobo → naira

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
