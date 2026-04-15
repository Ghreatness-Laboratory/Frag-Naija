import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';

export async function getUserBankAccount(userId) {
  const { data } = await supabaseAdmin
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data || null;
}

export async function saveUserBankAccount(userId, {
  bank_name,
  bank_code,
  account_number,
  account_name,
  paystack_recipient_code,
}) {
  const { data, error } = await supabaseAdmin
    .from('bank_accounts')
    .upsert(
      {
        user_id: userId,
        bank_name,
        bank_code,
        account_number,
        account_name,
        paystack_recipient_code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserWithdrawals(userId) {
  const { data, error } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitWithdrawal(userId, { amount }) {
  // 1. Check withdrawals_enabled setting
  const withdrawalsEnabled = await getSetting('withdrawals_enabled') ?? 'true';
  if (withdrawalsEnabled === 'false') {
    throw new Error('Withdrawals are currently disabled');
  }

  // 2. Get settings
  const feePercent    = Number(await getSetting('withdrawal_fee_percent'))  || 5;
  const minWithdrawal = Number(await getSetting('min_withdrawal_ngn'))       || 1000;
  const usdNgnRate    = Number(await getSetting('usd_ngn_rate'))             || 1600;
  const maxPayoutUsd  = Number(await getSetting('max_payout_usd'))           || 2000;

  // 3. Compute max
  const maxWithdrawal = usdNgnRate * maxPayoutUsd;

  // 4. Validate amount
  if (amount < minWithdrawal) {
    throw new Error(`Minimum withdrawal is ₦${minWithdrawal.toLocaleString()}`);
  }
  if (amount > maxWithdrawal) {
    throw new Error(`Maximum withdrawal is ₦${maxWithdrawal.toLocaleString()}`);
  }

  // 5. Get bank account
  const bankAccount = await getUserBankAccount(userId);
  if (!bankAccount) {
    throw new Error('Please save a bank account before withdrawing');
  }

  // 6. Check for existing Pending withdrawal
  const { data: pendingWithdrawal } = await supabaseAdmin
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'Pending')
    .maybeSingle();
  if (pendingWithdrawal) {
    throw new Error('You already have a pending withdrawal request');
  }

  // 7. Get wallet balance
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();
  if (walletError) throw walletError;
  if (Number(wallet.balance) < amount) {
    throw new Error('Insufficient wallet balance');
  }

  // 8. Compute fee and amount sent
  const fee        = Math.round(amount * feePercent) / 100;
  const amountSent = amount - fee;

  // 9. Deduct full amount from wallet immediately
  const { error: deductError } = await supabaseAdmin
    .from('wallets')
    .update({
      balance:    Number(wallet.balance) - amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (deductError) throw deductError;

  // 10. Insert withdrawal record
  const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
    .from('withdrawals')
    .insert([{
      user_id:                   userId,
      amount,
      fee,
      amount_sent:               amountSent,
      bank_name:                 bankAccount.bank_name,
      bank_code:                 bankAccount.bank_code,
      account_number:            bankAccount.account_number,
      account_name:              bankAccount.account_name,
      paystack_recipient_code:   bankAccount.paystack_recipient_code,
      status:                    'Pending',
    }])
    .select()
    .single();
  if (withdrawalError) throw withdrawalError;

  // 11. Insert wallet transaction
  const { error: txError } = await supabaseAdmin
    .from('wallet_transactions')
    .insert([{
      user_id:     userId,
      type:        'Adjustment',
      amount:      -Number(amount),
      description: `Withdrawal to ${bankAccount.bank_name} ****${bankAccount.account_number.slice(-4)}`,
    }]);
  if (txError) throw txError;

  return withdrawal;
}

export async function cancelWithdrawal(userId, withdrawalId) {
  // 1. Fetch withdrawal
  const { data: withdrawal, error: fetchError } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .eq('user_id', userId)
    .single();
  if (fetchError || !withdrawal) {
    throw new Error('Withdrawal not found');
  }

  // 2. Must be Pending
  if (withdrawal.status !== 'Pending') {
    throw new Error('Only pending withdrawals can be cancelled');
  }

  // 3. Update status to Cancelled
  const { error: updateError } = await supabaseAdmin
    .from('withdrawals')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', withdrawalId);
  if (updateError) throw updateError;

  // 4. Refund amount_sent (fee is non-refundable)
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();
  if (walletError) throw walletError;

  const { error: refundError } = await supabaseAdmin
    .from('wallets')
    .update({
      balance:    Number(wallet.balance) + Number(withdrawal.amount_sent),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (refundError) throw refundError;

  // 5. Insert wallet transaction for refund
  const { error: txError } = await supabaseAdmin
    .from('wallet_transactions')
    .insert([{
      user_id:     userId,
      type:        'Adjustment',
      amount:      Number(withdrawal.amount_sent),
      description: `Withdrawal cancelled — fee of ₦${withdrawal.fee} retained`,
    }]);
  if (txError) throw txError;

  return { cancelled: true, refunded: withdrawal.amount_sent };
}

export async function getAllWithdrawals({ status } = {}) {
  let query = supabaseAdmin
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function adminUpdateWithdrawal(withdrawalId, { action, note, adminId }) {
  const { data: withdrawal, error: fetchError } = await supabaseAdmin
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .single();
  if (fetchError || !withdrawal) {
    throw new Error('Withdrawal not found');
  }

  let newStatus;
  const updates = { updated_at: new Date().toISOString() };

  if (action === 'approve') {
    if (withdrawal.status !== 'Pending') {
      throw new Error('Only pending withdrawals can be approved');
    }
    newStatus = 'Approved';
    updates.status = newStatus;

  } else if (action === 'reject') {
    if (!['Pending', 'Approved'].includes(withdrawal.status)) {
      throw new Error('Only pending or approved withdrawals can be rejected');
    }
    newStatus = 'Failed';
    updates.status     = newStatus;
    updates.admin_note = note || null;

    // Full refund including fee
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .single();
    if (walletError) throw walletError;

    const { error: refundError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance:    Number(wallet.balance) + Number(withdrawal.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', withdrawal.user_id);
    if (refundError) throw refundError;

    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        user_id:     withdrawal.user_id,
        type:        'Adjustment',
        amount:      Number(withdrawal.amount),
        description: `Withdrawal rejected — full refund of ₦${withdrawal.amount}`,
      }]);
    if (txError) throw txError;

  } else if (action === 'complete') {
    if (withdrawal.status !== 'Approved') {
      throw new Error('Only approved withdrawals can be completed');
    }
    newStatus = 'Completed';
    updates.status = newStatus;

  } else if (action === 'fail') {
    if (withdrawal.status !== 'Approved') {
      throw new Error('Only approved withdrawals can be marked as failed');
    }
    newStatus = 'Failed';
    updates.status     = newStatus;
    updates.admin_note = note || null;

    // Full refund including fee
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', withdrawal.user_id)
      .single();
    if (walletError) throw walletError;

    const { error: refundError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance:    Number(wallet.balance) + Number(withdrawal.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', withdrawal.user_id);
    if (refundError) throw refundError;

    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        user_id:     withdrawal.user_id,
        type:        'Adjustment',
        amount:      Number(withdrawal.amount),
        description: `Withdrawal failed — full refund of ₦${withdrawal.amount}`,
      }]);
    if (txError) throw txError;

  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  const { error: updateError } = await supabaseAdmin
    .from('withdrawals')
    .update(updates)
    .eq('id', withdrawalId);
  if (updateError) throw updateError;

  return { done: true, status: newStatus };
}

export async function updateWithdrawalTransferInfo(withdrawalId, {
  paystack_transfer_code,
  paystack_reference,
}) {
  const { data, error } = await supabaseAdmin
    .from('withdrawals')
    .update({
      paystack_transfer_code,
      paystack_reference,
      updated_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
