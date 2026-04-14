import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';

const DEFAULT_FEE_PERCENT = 10;

export async function processDeposit({ reference, userId, amountPaid }) {
  // Deduplication — never credit the same reference twice
  const { data: existing } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .single();

  if (existing) return { duplicate: true };

  const feePercent = Number(await getSetting('platform_fee_percent')) || DEFAULT_FEE_PERCENT;
  const fee           = (amountPaid * feePercent) / 100;
  const amountCredited = amountPaid - fee;

  // Record transaction first
  const { error: txError } = await supabaseAdmin.from('transactions').insert([{
    user_id:         userId,
    reference,
    type:            'deposit',
    amount_paid:     amountPaid,
    fee,
    amount_credited: amountCredited,
    status:          'completed',
  }]);
  if (txError) throw txError;

  // Credit wallet (create if missing)
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from('wallets')
      .update({ balance: Number(wallet.balance) + amountCredited, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabaseAdmin
      .from('wallets')
      .insert([{ user_id: userId, balance: amountCredited, total_won: 0, total_lost: 0 }]);
  }

  return { ok: true, amountCredited, fee };
}

export async function getUserTransactions(userId) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllTransactions({ page = 1, limit = 100 } = {}) {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data, count };
}

export async function manualWalletAdjustment({ userId, amount, type, note }) {
  const reference = `ADMIN_${type.toUpperCase()}_${Date.now()}`;

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!wallet) throw new Error('Wallet not found for this user');

  const delta      = type === 'credit' ? amount : -amount;
  const newBalance = Number(wallet.balance) + delta;
  if (newBalance < 0) throw new Error('Debit would result in a negative balance');

  await supabaseAdmin
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  const { error: txError } = await supabaseAdmin.from('transactions').insert([{
    user_id:         userId,
    reference,
    type,
    amount_paid:     amount,
    fee:             0,
    amount_credited: delta,
    status:          'completed',
    note,
  }]);
  if (txError) throw txError;

  return { ok: true, newBalance };
}
