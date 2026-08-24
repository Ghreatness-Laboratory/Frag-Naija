import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { createWallet, getWallet } from '@/features/wagers/server';
import { createReferral } from '@/features/offers.server';
import { ensureUserProfile, getUserProfile, resolveReferralCode, validateMinimumAge } from '@/features/userProfile.server';

export function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function loginWithPassword({ email, password }) {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  return data;
}

export async function registerUser({ email, password, username, first_name, middle_name, last_name, preferred_game_slug, date_of_birth, referral_code }) {
  if (!date_of_birth || !validateMinimumAge(date_of_birth, 16)) throw new Error('You must be at least 16 years old to create a FragNaija account.');
  const referrerId = await resolveReferralCode(referral_code);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { username: username || email.split('@')[0], first_name: first_name || null, middle_name: middle_name || null, last_name: last_name || null, preferred_game_slug: preferred_game_slug || null },
    email_confirm: true,
  });
  if (error) throw error;

  try {
    await createWallet(data.user.id, { signupBonusEligible: true });
    await ensureUserProfile(data.user.id, { username: username || email.split('@')[0], first_name, middle_name, last_name, date_of_birth, referred_by: referrerId });
    if (referrerId) await createReferral(referrerId, data.user.id);
  } catch {
    // Wallet creation is non-fatal during registration.
  }

  return {
    id: data.user.id,
    email: data.user.email,
    username: data.user.user_metadata.username,
  };
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  let wallet = null;
  try {
    wallet = await getWallet(user.id);
  } catch {
    // Wallet may not exist yet.
  }

  let profile = null;
  try { profile = await getUserProfile(user.id); } catch {}

  // Fetch enrolled MFA factors using user-scoped client
  let factors = [];
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data } = await userClient.auth.mfa.listFactors();
    factors = data?.totp ?? [];
  } catch {}

  return {
    id:           user.id,
    email:        user.email,
    username:     profile?.username ?? user.user_metadata?.username,
    first_name: profile?.first_name ?? user.user_metadata?.first_name ?? null,
    middle_name: profile?.middle_name ?? user.user_metadata?.middle_name ?? null,
    last_name: profile?.last_name ?? user.user_metadata?.last_name ?? null,
    date_of_birth: profile?.date_of_birth ?? null,
    referral_code: profile?.referral_code ?? null,
    preferred_game_slug: user.user_metadata?.preferred_game_slug ?? null,
    provider:     user.app_metadata?.provider ?? 'email',
    totp_enabled: factors.some(f => f.status === 'verified'),
    factors,
    wallet,
  };
}
