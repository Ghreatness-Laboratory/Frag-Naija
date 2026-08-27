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

const WAGER_SELECT = 'id,question,subtitle,match_name,game_slug,yes_odds,no_odds,yes_price,no_price,pool_total,trade_count,type,options,hot,status,closes_at,featured_on_home,created_at';
const WAGER_BET_SELECT = 'id,wager_id,user_id,email,selection,amount,potential,reference,slip_code,verification_id,status,created_at';
// wallets has no created_at column; selecting it causes PostgREST to reject the entire row.
const WALLET_SELECT = 'id,user_id,balance,total_won,total_lost,updated_at';


async function generateUniqueSlipCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = `FN${Math.floor(10000 + Math.random() * 90000)}`;
    const { data } = await supabaseAdmin.from('wager_bets').select('id').eq('slip_code', code).maybeSingle();
    if (!data) return code;
  }
  throw new Error('Unable to generate a unique bet slip code. Please try again.');
}

export async function lookupBetSlip(codeOrId) {
  const value = String(codeOrId || '').trim();
  if (!value) throw new Error('Enter a Bet Slip Code or verification ID.');
  const isCode = /^FN\d{5}$/i.test(value);
  const query = supabaseAdmin
    .from('wager_bets')
    .select('id,wager_id,selection,amount,potential,reference,slip_code,verification_id,status,created_at')
    .eq(isCode ? 'slip_code' : 'verification_id', isCode ? value.toUpperCase() : value)
    .limit(1);
  const { data: bets, error } = await query;
  if (error) throw error;
  const primary = bets?.[0];
  if (!primary) throw new Error('No genuine FragNaija Wager Zone bet slip was found for that code or ID.');

  const prefix = String(primary.reference || '').split('-')[0];
  const { data: allBets, error: allError } = await supabaseAdmin
    .from('wager_bets')
    .select('id,wager_id,selection,amount,potential,reference,slip_code,verification_id,status,created_at')
    .or(`reference.eq.${prefix},reference.like.${prefix}-%`)
    .order('created_at', { ascending: true });
  if (allError) throw allError;

  const wagerIds = [...new Set((allBets || [primary]).map((bet) => bet.wager_id).filter(Boolean))];
  const { data: wagers, error: wagerError } = await supabaseAdmin
    .from('wagers')
    .select(WAGER_SELECT)
    .in('id', wagerIds);
  if (wagerError) throw wagerError;
  const wagerMap = new Map((wagers || []).map((wager) => [String(wager.id), wager]));
  const now = new Date();

  const selections = (allBets?.length ? allBets : [primary]).map((bet) => {
    const wager = wagerMap.get(String(bet.wager_id));
    const options = Array.isArray(wager?.options) ? wager.options : [];
    const option = options.find((item) => item.label === bet.selection);
    const liveOdds = option ? Number(option.odds) : bet.selection === 'YES' ? Number(wager?.yes_odds) : Number(wager?.no_odds);
    const available = wager?.status === 'Active' && wager?.closes_at && new Date(wager.closes_at) > now && Number(liveOdds) > 0;
    return { wager_id: bet.wager_id, selection: bet.selection, original_amount: bet.amount, original_potential: bet.potential, market: wager, live_odds: liveOdds, available };
  });

  return { slip_code: primary.slip_code, verification_id: primary.verification_id, reference: prefix, status: primary.status, stake: primary.amount, potential: primary.potential, created_at: primary.created_at, selections, redeemable: selections.every((item) => item.available) };
}

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
    .select(WAGER_SELECT)
    .order('created_at', { ascending: false });
  if (game_slug) query = query.eq('game_slug', game_slug);
  const { data, error } = await query;
  if (error) throw error;

  return data;
}

export async function getActiveWagers({ game_slug } = {}) {
  let query = supabaseAdmin
    .from('wagers')
    .select(WAGER_SELECT)
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
  const { data: wager, error } = await supabaseAdmin.from('wagers').select(WAGER_SELECT).eq('id', id).single();
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
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const matchName = typeof body.match_name === 'string' ? body.match_name.trim() : '';
  const type = body.type ?? 'binary';
  const options = Array.isArray(body.options) ? body.options : [];

  if (!question || !matchName || !body.closes_at) {
    throw new Error('Question, match / game fixture, and closing time are required.');
  }
  if (!['binary', 'player_pick', 'team_pick'].includes(type)) {
    throw new Error('Choose a valid wager type.');
  }
  if ((type === 'player_pick' || type === 'team_pick') &&
    (options.length < 2 || options.some((option) => !String(option?.label ?? '').trim() || !Number.isFinite(Number(option?.odds)) || Number(option.odds) <= 1))) {
    throw new Error('Pick wagers need at least two named options with odds greater than 1.');
  }

  const payload = {
    ...body,
    question,
    match_name: matchName,
    type,
    options,
  };
  const { data, error } = await supabaseAdmin.from('wagers').insert([payload]).select().single();
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
  const usdNgnRate   = Number(await getSetting('usd_ngn_rate'))   || 1600;
  const maxPayoutUsd = Number(await getSetting('max_payout_usd')) || 2000;
  const maxPayoutNgn = usdNgnRate * maxPayoutUsd;

  const { data: settlement, error: settlementError } = await supabaseAdmin.rpc('settle_wager_market', {
    p_wager_id: id,
    p_outcome: outcome,
    p_max_payout: maxPayoutNgn,
  });

  if (settlementError) throw settlementError;
  return settlement || { settled: true, winners: 0, losers: 0, credited: 0 };
}

export async function cancelWager(id) {
  const { data: bets, error: betsError } = await supabaseAdmin
    .from('wager_bets')
    .select(WAGER_BET_SELECT)
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
  const { data, error } = await supabaseAdmin.rpc('admin_delete_settled_wager', { p_wager_id: id });
  if (error) throw error;
  return data;
}

export async function createWagerBet({ wager_id, user_id, email, selection, amount, potential, reference, slip_code, paidFromWallet = false }) {
  if (user_id) await assertUserAtLeast(user_id, 18);
  const finalSlipCode = slip_code || (Number(amount) > 0 ? await generateUniqueSlipCode() : null);
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
    if (data && finalSlipCode) await supabaseAdmin.from('wager_bets').update({ slip_code: finalSlipCode }).eq('id', Array.isArray(data) ? data[0]?.id : data.id);
    const placed = Array.isArray(data) ? { ...data[0], slip_code: finalSlipCode } : { ...data, slip_code: finalSlipCode };
    return placed;
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
    .insert([{ wager_id, user_id, email, selection, amount, potential, reference, slip_code: finalSlipCode, status: 'Active' }])
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
  const { data, error } = await supabaseAdmin.from('wallets').select(WALLET_SELECT).eq('user_id', userId).single();
  if (error) {
    console.error('getWallet query failed', { userId, code: error.code, message: error.message, details: error.details });
    throw error;
  }

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
