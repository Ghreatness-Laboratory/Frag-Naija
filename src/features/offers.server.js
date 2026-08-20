import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { getSetting } from '@/features/settings/server';
import { getUserProfile } from '@/features/userProfile.server';

async function creditWallet(userId, amount, description) {
  await supabaseAdmin.from('wallets').upsert({ user_id: userId }, { onConflict: 'user_id' });
  const { data: wallet, error } = await supabaseAdmin.from('wallets').select('balance').eq('user_id', userId).single();
  if (error) throw error;
  const { error: updateError } = await supabaseAdmin.from('wallets').update({ balance: Number(wallet.balance || 0) + Number(amount), updated_at: new Date().toISOString() }).eq('user_id', userId);
  if (updateError) throw updateError;
  await supabaseAdmin.from('wallet_transactions').insert([{ user_id: userId, type: 'Adjustment', amount: Number(amount), currency: 'NGN', description }]);
}

function anonymize(value) {
  const raw = String(value || 'Player');
  if (raw.length <= 3) return `${raw[0] || 'P'}***`;
  return `${raw.slice(0, 3)}***`;
}

async function userDisplay(userId) {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = data?.user;
  return user?.user_metadata?.username || user?.email?.split('@')[0] || userId;
}

export async function createReferral(referrerId, referredId) {
  if (!referrerId || !referredId || referrerId === referredId) return null;
  const bonus = Number(await getSetting('referral_bonus_ngn')) || 500;
  const { data, error } = await supabaseAdmin.from('referrals').insert([{ referrer_id: referrerId, referred_id: referredId, bonus_amount_ngn: bonus }]).select().single();
  if (error && error.code !== '23505') throw error;
  return data || null;
}

export async function qualifyReferralForWagerBet(referredId, wagerBetId) {
  const { data: referral } = await supabaseAdmin.from('referrals').select('*').eq('referred_id', referredId).eq('status', 'Pending').single();
  if (!referral) return null;
  const bonus = Number(await getSetting('referral_bonus_ngn')) || Number(referral.bonus_amount_ngn) || 500;
  const { data, error } = await supabaseAdmin.from('referrals').update({ status: 'Qualified', bonus_amount_ngn: bonus, qualified_wager_bet_id: wagerBetId, qualified_at: new Date().toISOString() }).eq('id', referral.id).eq('status', 'Pending').select().single();
  if (error) throw error;
  await creditWallet(referral.referrer_id, bonus, `Referral bonus for Wager Zone bet ${wagerBetId}`);
  return data;
}

export async function getOffers(userId) {
  const profile = await getUserProfile(userId);
  const { data: referrals } = await supabaseAdmin.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false });
  return {
    referral_code: profile.referral_code,
    referrals: await Promise.all((referrals || []).map(async (row) => ({ ...row, referred_display: anonymize(await userDisplay(row.referred_id)) }))),
  };
}

export async function redeemPromoCode(userId, code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) throw new Error('Enter a promo code.');
  const { data: promo, error } = await supabaseAdmin.from('promo_codes').select('*').eq('code', normalized).eq('is_active', true).single();
  if (error || !promo) throw new Error('Promo code is invalid or inactive.');
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error('Promo code has expired.');
  const { count } = await supabaseAdmin.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', promo.id);
  if (promo.usage_limit && Number(count || 0) >= Number(promo.usage_limit)) throw new Error('Promo code usage limit reached.');
  const { count: userCount } = await supabaseAdmin.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', promo.id).eq('user_id', userId);
  if (Number(userCount || 0) >= Number(promo.per_user_limit || 1)) throw new Error('You have already redeemed this promo code.');
  await creditWallet(userId, Number(promo.value_ngn), `Promo code ${normalized}`);
  const { data, error: redemptionError } = await supabaseAdmin.from('promo_redemptions').insert([{ promo_code_id: promo.id, user_id: userId, amount_ngn: Number(promo.value_ngn) }]).select().single();
  if (redemptionError) throw redemptionError;
  return data;
}
