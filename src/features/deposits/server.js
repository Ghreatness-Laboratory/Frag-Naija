import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';

const DEFAULT_FEE_PERCENT = 10;

export async function processDeposit({ reference, userId, amountPaid }) {
  const { data: existing } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('reference', reference)
    .maybeSingle();
  if (existing) return { duplicate: true };

  const feePercent = Number(await getSetting('platform_fee_percent')) || DEFAULT_FEE_PERCENT;
  const fee = (amountPaid * feePercent) / 100;
  const amountCredited = amountPaid - fee;

  const { data: transaction, error } = await supabaseAdmin.rpc('process_wallet_deposit', {
    p_user_id: userId,
    p_reference: reference,
    p_amount_paid: amountPaid,
    p_fee: fee,
    p_amount_credited: amountCredited,
  });
  if (error) throw error;

  return { ok: true, amountCredited, fee, transaction };
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
  const { data, error } = await supabaseAdmin.rpc('admin_wallet_adjustment', {
    p_user_id: userId,
    p_reference: reference,
    p_type: type,
    p_amount: amount,
    p_note: note || null,
  });
  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  return { ok: true, newBalance: Number(result?.new_balance ?? 0), transactionId: result?.transaction_id ?? null };
}
