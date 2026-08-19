import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';

async function settingNumber(key, fallback) {
  const value = Number(await getSetting(key));
  return Number.isFinite(value) ? value : fallback;
}

async function userLabel(userId) {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = data?.user;
  return user?.user_metadata?.username || user?.email?.split('@')[0] || userId;
}

export async function searchUsersByUsername(query, currentUserId) {
  const q = String(query || '').toLowerCase().trim();
  if (q.length < 2) return [];
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return (data?.users || [])
    .filter((user) => user.id !== currentUserId)
    .map((user) => ({ id: user.id, username: user.user_metadata?.username || user.email?.split('@')[0] || 'Player' }))
    .filter((user) => user.username.toLowerCase().includes(q))
    .slice(0, 8);
}

async function debitWallet(userId, amount, description) {
  const { data: wallet, error } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
  if (error || !wallet) throw new Error('Wallet not found');
  if (Number(wallet.balance) < amount) throw new Error('Insufficient wallet balance');
  const { error: updateError } = await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) - amount, updated_at: new Date().toISOString() }).eq('user_id', userId);
  if (updateError) throw updateError;
  await supabaseAdmin.from('wallet_transactions').insert([{ user_id: userId, type: 'Custom Wager Escrow', amount: -amount, description }]);
}

async function creditWallet(userId, amount, description) {
  const { data: wallet, error } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
  if (error || !wallet) throw new Error('Wallet not found');
  const { error: updateError } = await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance) + amount, updated_at: new Date().toISOString() }).eq('user_id', userId);
  if (updateError) throw updateError;
  await supabaseAdmin.from('wallet_transactions').insert([{ user_id: userId, type: 'Custom Wager Payout', amount, description }]);
}

export async function listCustomWagers(userId, { admin = false } = {}) {
  let query = supabaseAdmin.from('custom_wagers').select('*, evidence:custom_wager_evidence(*)').order('created_at', { ascending: false });
  if (!admin) query = query.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);
  const { data, error } = await query;
  if (error) throw error;
  return Promise.all((data || []).map(async (w) => ({ ...w, creator_name: await userLabel(w.creator_id), opponent_name: await userLabel(w.opponent_id) })));
}

export async function createCustomWager(userId, body) {
  const stake = Number(body.stake_amount);
  const min = await settingNumber('custom_wager_min_stake', 500);
  const max = await settingNumber('custom_wager_max_stake', 5000000);
  if (!body.opponent_id || body.opponent_id === userId) throw new Error('Choose an opponent');
  if (!String(body.terms || '').trim()) throw new Error('Terms are required');
  if (!body.game_slug) throw new Error('Game selection is required');
  if (!Number.isFinite(stake) || stake < min || stake > max) throw new Error(`Stake must be between ₦${min.toLocaleString()} and ₦${max.toLocaleString()}`);
  const fee = await settingNumber('custom_wager_fee_percent', 10);
  const { data, error } = await supabaseAdmin.from('custom_wagers').insert([{ 
    creator_id: userId, 
    opponent_id: body.opponent_id, 
    terms: String(body.terms).trim(), 
    stake_amount: stake, 
    platform_fee_percent: fee,
    game_slug: body.game_slug 
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function actOnCustomWager(userId, id, action, body = {}) {
  const { data: wager, error } = await supabaseAdmin.from('custom_wagers').select('*').eq('id', id).single();
  if (error) throw error;
  const isCreator = wager.creator_id === userId;
  const isOpponent = wager.opponent_id === userId;
  if (!isCreator && !isOpponent) throw new Error('Not your wager');

  if (action === 'accept') await supabaseAdmin.from('custom_wagers').update({ status: 'funding', updated_at: new Date().toISOString() }).eq('id', id).eq('opponent_id', userId);
  if (action === 'fund') {
    if (wager.status !== 'funding' && wager.status !== 'pending_acceptance') throw new Error('Wager is not fundable');
    await debitWallet(userId, Number(wager.stake_amount), `Custom wager escrow - ${id}`);
    const updates = { updated_at: new Date().toISOString(), ...(isCreator ? { creator_funded: true } : { opponent_funded: true }) };
    const bothFunded = (isCreator ? true : wager.creator_funded) && (isOpponent ? true : wager.opponent_funded);
    if (bothFunded) updates.status = 'active';
    await supabaseAdmin.from('custom_wagers').update(updates).eq('id', id);
  }
  if (action === 'claim') {
    const updates = { updated_at: new Date().toISOString(), ...(isCreator ? { creator_claim: body.winner_id } : { opponent_claim: body.winner_id }) };
    // Include proof_of_win_url if provided
    if (body.proof_of_win_url) {
      updates.proof_of_win_url = body.proof_of_win_url;
    }
    const otherClaim = isCreator ? wager.opponent_claim : wager.creator_claim;
    if (otherClaim && otherClaim === body.winner_id) {
      const payout = Number(wager.stake_amount) * 2 * (1 - Number(wager.platform_fee_percent) / 100);
      await creditWallet(body.winner_id, payout, `Custom wager payout - ${id}`);
      Object.assign(updates, { status: 'settled', winner_id: body.winner_id, resolved_at: new Date().toISOString() });
    } else if (otherClaim && otherClaim !== body.winner_id) updates.status = 'disputed';
    await supabaseAdmin.from('custom_wagers').update(updates).eq('id', id);
  }
  if (action === 'evidence') {
    await supabaseAdmin.from('custom_wager_evidence').insert([{ custom_wager_id: id, user_id: userId, image_url: body.image_url, note: body.note || null }]);
    await supabaseAdmin.from('custom_wagers').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', id);
  }
  return listCustomWagers(userId);
}

export async function adminResolveCustomWager(adminUserId, id, body) {
  const { data: wager, error } = await supabaseAdmin.from('custom_wagers').select('*').eq('id', id).single();
  if (error) throw error;
  if (body.decision === 'refund') {
    if (wager.creator_funded) await creditWallet(wager.creator_id, Number(wager.stake_amount), `Custom wager refund - ${id}`);
    if (wager.opponent_funded) await creditWallet(wager.opponent_id, Number(wager.stake_amount), `Custom wager refund - ${id}`);
    await supabaseAdmin.from('custom_wagers').update({ status: 'refunded', resolved_by: adminUserId, resolution_reason: body.reason || null, resolved_at: new Date().toISOString() }).eq('id', id);
  } else {
    const winnerId = body.winner_id;
    const payout = Number(wager.stake_amount) * 2 * (1 - Number(wager.platform_fee_percent) / 100);
    await creditWallet(winnerId, payout, `Custom wager admin payout - ${id}`);
    await supabaseAdmin.from('custom_wagers').update({ status: 'settled', winner_id: winnerId, resolved_by: adminUserId, resolution_reason: body.reason || null, resolved_at: new Date().toISOString() }).eq('id', id);
  }
  await supabaseAdmin.from('custom_wager_resolution_logs').insert([{ custom_wager_id: id, resolved_by: adminUserId, decision: body.decision, reason: body.reason || null }]);
  return { ok: true };
}
