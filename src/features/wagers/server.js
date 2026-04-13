import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

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
    .select('id, status, closes_at, yes_odds, no_odds')
    .eq('id', wagerId)
    .single();
  if (error) throw error;

  return data;
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
  const status = outcome === 'YES' ? 'Settled - YES Wins' : 'Settled - NO Wins';

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

  let winners = 0;
  let losers = 0;

  for (const bet of bets) {
    const won = bet.selection === outcome;
    const nextStatus = won ? 'Won' : 'Lost';

    await supabaseAdmin.from('wager_bets').update({ status: nextStatus }).eq('id', bet.id);

    if (!won) {
      losers += 1;
      continue;
    }

    const odds = outcome === 'YES' ? wager.yes_odds : wager.no_odds;
    const payout = Number(bet.amount) * Number(odds);

    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance, total_won')
      .eq('user_id', bet.user_id)
      .single();

    if (wallet) {
      await supabaseAdmin
        .from('wallets')
        .update({
          balance: Number(wallet.balance) + payout,
          total_won: Number(wallet.total_won) + payout,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', bet.user_id);
    }

    winners += 1;
  }

  return { settled: true, winners, losers };
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
