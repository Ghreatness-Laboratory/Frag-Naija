import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { assertUserAtLeast } from '@/features/userProfile.server';
import { qualifyReferralForWagerBet } from '@/features/offers.server';
import { getSetting } from '@/features/settings/server';
import {
  createTransferRecipient,
  initiateTransfer,
  generateReference,
} from '@/lib/paystack';

export const SIGNUP_BONUS_AMOUNT = 500;

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

export async function getWagers({ game_slug } = {}) {
  let query = supabaseAdmin
    .from('wagers')
    .select('*')
    .order('created_at', { ascending: false });
  if (game_slug) query = query.eq('game_slug', game_slug);
  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function getActiveWagers({ game_slug } = {}) {
  let query = supabaseAdmin
    .from('wagers')
    .select('*')
    .eq('status', 'Active')
    .gt('closes_at', new Date().toISOString())
    .order('hot', { ascending: false })
    .order('created_at', { ascending: false });
  if (game_slug) query = query.eq('game_slug', game_slug);
  const { data, error } = await query;
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
  const { data: wager, error: wagerError } = await supabaseAdmin
    .from('wagers')
    .select('yes_odds, no_odds, type, options')
    .eq('id', id)
    .single();
  if (wagerError) throw wagerError;

  const isPlayerPick = wager.type === 'player_pick';
  const status = isPlayerPick
    ? `Settled — ${outcome} Wins`
    : outcome === 'YES' ? 'Settled — YES Wins' : 'Settled — NO Wins';

  const { error: updateWagerError } = await supabaseAdmin.from('wagers').update({ status }).eq('id', id);
  if (updateWagerError) throw updateWagerError;

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
        const { error: lossError } = await supabaseAdmin.rpc('record_wager_loss', { p_user_id: bet.user_id, p_amount: Number(bet.amount) });
        if (lossError) throw lossError;
      }

      losers += 1;
      continue;
    }

    // Resolve correct odds — player_pick uses per-option odds, binary uses yes/no odds
    let odds;
    if (isPlayerPick) {
      const option = Array.isArray(wager.options)
        ? wager.options.find((o) => o.label === outcome)
        : null;
      odds = option?.odds ?? 1;
    } else {
      odds = outcome === 'YES' ? wager.yes_odds : wager.no_odds;
    }

    const payout = Math.min(Number(bet.amount) * Number(odds), maxPayoutNgn);

    if (bet.user_id) {
      const { error: payoutError } = await supabaseAdmin.rpc('credit_wager_payout', {
        p_user_id: bet.user_id,
        p_wager_id: id,
        p_bet_id: bet.id,
        p_payout: payout,
        p_description: `Wager payout — ${outcome} wins (${Number(odds).toFixed(2)}x)`,
      });
      if (payoutError) throw payoutError;
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

    const { error: refundError } = await supabaseAdmin.rpc('refund_wager_stake', {
      p_user_id: bet.user_id,
      p_wager_id: id,
      p_bet_id: bet.id,
      p_amount: Number(bet.amount),
      p_description: 'Wager cancelled — stake refunded',
    });
    if (refundError) throw refundError;
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

export async function createWagerBet({ wager_id, user_id, email, selection, amount, potential, reference, paidFromWallet = false }) {
  if (user_id) await assertUserAtLeast(user_id, 18);
  if (paidFromWallet) {
    const { data, error } = await supabaseAdmin.rpc('place_wager_from_wallet', {
      p_user_id: user_id,
      p_wager_id: wager_id,
      p_email: email,
      p_selection: selection,
      p_amount: Number(amount),
      p_potential: Number(potential),
      p_reference: reference,
    });
    if (error) throw error;
    if (user_id && data) await qualifyReferralForWagerBet(user_id, Array.isArray(data) ? data[0]?.id : data.id).catch(() => {});
    return data;
  }

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

  if (user_id) await qualifyReferralForWagerBet(user_id, data.id).catch(() => {});

  if (user_id && Number(amount) > 0) {
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

export async function createWallet(userId, { signupBonusEligible = false } = {}) {
  const { data, error } = await supabaseAdmin
    .from('wallets')
    .insert([{
      user_id: userId,
      balance: 0,
      total_won: 0,
      total_lost: 0,
      signup_bonus_eligible: signupBonusEligible,
      signup_bonus_claimed: false,
    }])
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function getSignupBonusStatus(userId) {
  const wallet = await getWallet(userId);
  const claimed = Boolean(wallet.signup_bonus_claimed);
  const eligible = Boolean(wallet.signup_bonus_eligible) && !claimed;

  return {
    amount: SIGNUP_BONUS_AMOUNT,
    eligible,
    claimed,
    claimed_at: wallet.signup_bonus_claimed_at ?? null,
  };
}

export async function claimSignupBonus(userId) {
  const { data, error } = await supabaseAdmin.rpc('claim_signup_bonus', {
    p_user_id: userId,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;

  return {
    amount: SIGNUP_BONUS_AMOUNT,
    creditedAmount: Number(result?.credited_amount ?? 0),
    claimed: Boolean(result?.signup_bonus_claimed),
    claimed_at: result?.signup_bonus_claimed_at ?? null,
    wallet: {
      id: result?.wallet_id ?? null,
      balance: Number(result?.balance ?? 0),
    },
  };
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
