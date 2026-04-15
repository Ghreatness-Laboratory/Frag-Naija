import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';
import {
  createTransferRecipient,
  initiateTransfer,
  generateReference,
} from '@/lib/paystack';

export async function processWithdrawal(userId, { amount, account_number, bank_code, name }) {
  // 1. Verify amount
  if (amount < 1000) {
    throw new Error('Minimum withdrawal amount is ₦1,000');
  }

  // 2. Verify balance
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (walletError || !wallet) {
    throw new Error('Wallet not found');
  }

  if (Number(wallet.balance) < amount) {
    throw new Error('Insufficient funds');
  }

  // 3. Create Paystack Recipient
  const recipientRes = await createTransferRecipient({
    name,
    account_number,
    bank_code,
  });

  if (!recipientRes.status) {
    throw new Error(`Paystack: ${recipientRes.message || 'Failed to create recipient'}`);
  }

  const recipientCode = recipientRes.data.recipient_code;

  // 4. Initiate Paystack Transfer
  const reference = generateReference('WD');
  const transferRes = await initiateTransfer({
    amount,
    recipient: recipientCode,
    reference,
    reason: `Frag Naija Withdrawal: ${amount}`,
  });

  if (!transferRes.status) {
    throw new Error(`Paystack: ${transferRes.message || 'Transfer failed'}`);
  }

  // 5. Update Wallet & Log Transaction
  // We do this AFTER initiation because if initiation fails, we haven't lost money.
  // Note: In a production app, you might want to wrap this in a DB transaction
  // or use a status like 'Pending' and confirm via webhook.
  const { error: updateError } = await supabaseAdmin
    .from('wallets')
    .update({
      balance: Number(wallet.balance) - amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    // This is a critical state: Paystack sent money, but DB didn't update.
    // In a real app, you'd log this for manual resolution or retry.
    console.error('CRITICAL: Withdrawal balance update failed after Paystack initiation', updateError);
  }

  await supabaseAdmin.from('wallet_transactions').insert([
    {
      user_id: userId,
      type: 'Withdrawal',
      amount: amount * -1,
      description: `Withdrawal to ${name} (${account_number})`,
    },
  ]);

  return { success: true, reference, amount };
}

export async function getWagers() {
  const { data, error } = await supabaseAdmin
    .from('wagers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data;
}

export async function getActiveWagers() {
  const { data, error } = await supabaseAdmin
    .from('wagers')
    .select('*')
    .eq('status', 'Active')
    .gt('closes_at', new Date().toISOString())
    .order('hot', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data;
}

export async function getWagerById(id) {
  const { data: wager, error } = await supabaseAdmin.from('wagers').select('*').eq('id', id).single();
  if (error) throw error;

  const { data: bets, error: betsError } = await supabaseAdmin
    .from('wager_bets')
    .select('selection, amount')
    .eq('wager_id', id);
  if (betsError) throw betsError;

  const yesBets = bets.filter((bet) => bet.selection === 'YES');
  const noBets = bets.filter((bet) => bet.selection === 'NO');

  return {
    ...wager,
    yes_count: yesBets.length,
    no_count: noBets.length,
    yes_pool: yesBets.reduce((sum, bet) => sum + Number(bet.amount), 0),
    no_pool: noBets.reduce((sum, bet) => sum + Number(bet.amount), 0),
  };
}

export async function getWagerForPlacement(wagerId) {
  const { data, error } = await supabaseAdmin
    .from('wagers')
    .select('id, status, closes_at, yes_odds, no_odds, type, options')
    .eq('id', wagerId)
    .single();
  if (error) throw error;

  return data;
}

export async function getUserWagers(userId) {
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('wager_bets')
    .select('id, wager_id, selection, amount, potential, status, created_at, reference')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (betsError) throw betsError;

  if (!bets?.length) {
    return [];
  }

  const wagerIds = [...new Set(bets.map((bet) => bet.wager_id).filter(Boolean))];
  const { data: wagers, error: wagersError } = await supabaseAdmin
    .from('wagers')
    .select('id, question, subtitle, closes_at, yes_odds, no_odds, status')
    .in('id', wagerIds);
  if (wagersError) throw wagersError;

  const wagersById = new Map((wagers || []).map((wager) => [String(wager.id), wager]));

  return bets.map((bet) => {
    const wager = wagersById.get(String(bet.wager_id));
    const odds = bet.selection === 'YES' ? Number(wager?.yes_odds ?? 0) : Number(wager?.no_odds ?? 0);

    return {
      ...bet,
      wager_status: wager?.status ?? null,
      odds,
      wager: wager
        ? {
            id: wager.id,
            question: wager.question || 'Untitled wager market',
            subtitle: wager.subtitle || null,
            closes_at: wager.closes_at,
          }
        : null,
    };
  });
}

export async function createWager(body) {
  const { data, error } = await supabaseAdmin.from('wagers').insert([body]).select().single();
  if (error) throw error;

  return data;
}

export async function toggleWagerHot(id) {
  const { data: wager, error: wagerError } = await supabaseAdmin
    .from('wagers')
    .select('hot')
    .eq('id', id)
    .single();
  if (wagerError) throw wagerError;

  const { data, error } = await supabaseAdmin
    .from('wagers')
    .update({ hot: !wager.hot })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function settleWager(id, outcome) {
  const status = outcome === 'YES' ? 'Settled — YES Wins' : 'Settled — NO Wins';

  const { error: updateWagerError } = await supabaseAdmin.from('wagers').update({ status }).eq('id', id);
  if (updateWagerError) throw updateWagerError;

  const { data: wager, error: wagerError } = await supabaseAdmin
    .from('wagers')
    .select('yes_odds, no_odds')
    .eq('id', id)
    .single();
  if (wagerError) throw wagerError;

  const { data: bets, error: betsError } = await supabaseAdmin
    .from('wager_bets')
    .select('*')
    .eq('wager_id', id)
    .eq('status', 'Active');
  if (betsError) throw betsError;

  const usdNgnRate   = Number(await getSetting('usd_ngn_rate'))   || 1600;
  const maxPayoutUsd = Number(await getSetting('max_payout_usd')) || 2000;
  const maxPayoutNgn = usdNgnRate * maxPayoutUsd;

  let winners = 0;
  let losers  = 0;

  for (const bet of bets) {
    const won        = bet.selection === outcome;
    const nextStatus = won ? 'Won' : 'Lost';

    await supabaseAdmin.from('wager_bets').update({ status: nextStatus }).eq('id', bet.id);

    if (!won) {
      const { data: loserWallet } = await supabaseAdmin
        .from('wallets')
        .select('total_lost')
        .eq('user_id', bet.user_id)
        .single();

      if (loserWallet) {
        await supabaseAdmin
          .from('wallets')
          .update({
            total_lost: Number(loserWallet.total_lost) + Number(bet.amount),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', bet.user_id);
      }

      losers += 1;
      continue;
    }

    const odds   = outcome === 'YES' ? wager.yes_odds : wager.no_odds;
    const payout = Math.min(Number(bet.amount) * Number(odds), maxPayoutNgn);

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, total_won')
      .eq('user_id', bet.user_id)
      .single();

    if (wallet) {
      await supabaseAdmin
        .from('wallets')
        .update({
          balance:    Number(wallet.balance)   + payout,
          total_won:  Number(wallet.total_won) + payout,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', bet.user_id);
    }

    if (bet.user_id) {
      await supabaseAdmin
        .from('wallet_transactions')
        .insert([{
          user_id:     bet.user_id,
          wager_id:    id,
          bet_id:      bet.id,
          type:        'Payout',
          amount:      payout,
          currency:    'NGN',
          description: `Wager payout — ${outcome} wins (${Number(odds).toFixed(2)}x)`,
        }]);
    }

    winners += 1;
  }

  return { settled: true, winners, losers };
}

export async function cancelWager(id) {
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('wager_bets')
    .select('*')
    .eq('wager_id', id)
    .eq('status', 'Active');
  if (betsError) throw betsError;

  const { error: cancelErr } = await supabaseAdmin
    .from('wagers')
    .update({ status: 'Cancelled' })
    .eq('id', id);
  if (cancelErr) throw cancelErr;

  for (const bet of bets) {
    await supabaseAdmin.from('wager_bets').update({ status: 'Refunded' }).eq('id', bet.id);

    if (!bet.user_id) continue;

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', bet.user_id)
      .single();

    if (wallet) {
      await supabaseAdmin
        .from('wallets')
        .update({ balance: Number(wallet.balance) + Number(bet.amount), updated_at: new Date().toISOString() })
        .eq('user_id', bet.user_id);
    }

    await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        user_id:     bet.user_id,
        wager_id:    id,
        bet_id:      bet.id,
        type:        'Refund',
        amount:      Number(bet.amount),
        currency:    'NGN',
        description: `Wager cancelled — stake refunded`,
      }]);
  }

  return { cancelled: true, refunded: bets.length };
}

export async function deleteWager(id) {
  const { data: bets } = await supabaseAdmin.from('wager_bets').select('id').eq('wager_id', id).limit(1);

  if (bets?.length) {
    throw new Error('Cannot delete a wager that has existing bets');
  }

  const { error } = await supabaseAdmin.from('wagers').delete().eq('id', id);
  if (error) throw error;
}

export async function createWagerBet({ wager_id, user_id, email, selection, amount, potential, reference }) {
  const { data: existing } = await supabaseAdmin
    .from('wager_bets')
    .select('id')
    .eq('reference', reference)
    .single();

  if (existing) {
    return { duplicate: true };
  }

  const { data, error } = await supabaseAdmin
    .from('wager_bets')
    .insert([{ wager_id, user_id, email, selection, amount, potential, reference, status: 'Active' }])
    .select()
    .single();
  if (error) throw error;

  await supabaseAdmin.rpc('increment_wager_pool', { wager_id, amount });

  if (user_id) {
    await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        user_id,
        wager_id,
        bet_id:      data.id,
        type:        'Stake',
        amount:      -Number(amount),
        currency:    'NGN',
        description: `Wager stake — ${selection} on wager ${wager_id}`,
      }]);
  }

  return data;
}

export async function getWallet(userId) {
  const { data, error } = await supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single();
  if (error) throw error;

  return data;
}

export async function createWallet(userId) {
  const { data, error } = await supabaseAdmin
    .from('wallets')
    .insert([{ user_id: userId, balance: 0, total_won: 0, total_lost: 0 }])
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function getUserIdByEmail(email) {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((entry) => entry.email === email);
  return user?.id ?? null;
}

export async function getWalletTransactions(userId, { limit = 10 } = {}) {
  const { data, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('id, type, amount, currency, description, wager_id, bet_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return data;
}
