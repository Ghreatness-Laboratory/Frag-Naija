import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { createWagerBet, getUserIdByEmail } from '@/features/wagers/server';
import { processDeposit } from '@/features/deposits/server';
import { updateWithdrawalTransferInfo, adminUpdateWithdrawal } from '@/features/withdrawals/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const rawBody   = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // ── Transfer events (withdrawals) ────────────────────────────────────────
    if (event.event === 'transfer.success') {
      const { reference, transfer_code } = event.data;
      // Find withdrawal by paystack_reference
      const { data: withdrawal } = await supabaseAdmin
        .from('withdrawals')
        .select('id')
        .eq('paystack_reference', reference)
        .maybeSingle();
      if (withdrawal) {
        await updateWithdrawalTransferInfo(withdrawal.id, { paystack_transfer_code: transfer_code, paystack_reference: reference });
        await adminUpdateWithdrawal(withdrawal.id, { action: 'complete', note: 'Auto-completed via Paystack transfer webhook', adminId: 'paystack-webhook' });
      }
      return NextResponse.json({ received: true });
    }

    if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const { reference } = event.data;
      const { data: withdrawal } = await supabaseAdmin
        .from('withdrawals')
        .select('id')
        .eq('paystack_reference', reference)
        .maybeSingle();
      if (withdrawal) {
        await adminUpdateWithdrawal(withdrawal.id, { action: 'fail', note: `Transfer ${event.event} via Paystack webhook`, adminId: 'paystack-webhook' });
      }
      return NextResponse.json({ received: true });
    }

    // ── Charge events (deposits / wager bets) ────────────────────────────────
    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const { reference, metadata, amount, customer } = event.data;
    const amountNGN = amount / 100; // kobo → naira

    if (metadata?.payment_type === 'deposit') {
      const userId = metadata.user_id;
      if (!userId) {
        console.error('Deposit webhook missing user_id in metadata', { reference });
        return NextResponse.json({ received: true });
      }
      const result = await processDeposit({ reference, userId, amountPaid: amountNGN });
      console.info('Deposit webhook processed:', { reference, userId, result });
      return NextResponse.json({ received: true });
    }

    // Wager bet / accumulator flow
    const { wager_id, selection, potential } = metadata;
    const email   = customer.email;
    const user_id = await getUserIdByEmail(email);
    const selections = Array.isArray(metadata?.selections)
      ? metadata.selections
      : [{ wager_id, selection }];

    for (let index = 0; index < selections.length; index += 1) {
      const item = selections[index];
      await createWagerBet({
        wager_id: item.wager_id,
        user_id,
        email,
        selection: item.selection,
        amount:    index === 0 ? amountNGN : 0,
        potential: index === 0 ? Number(potential) : 0,
        reference: index === 0 ? reference : `${reference}-${index + 1}`,
      });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
