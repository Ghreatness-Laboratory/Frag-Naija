import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';
import { createWallet, getWallet } from '@/features/wagers/server';

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

export async function registerUser({ email, password, username }) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { username: username || email.split('@')[0] },
    email_confirm: true,
  });
  if (error) throw error;

  try {
    await createWallet(data.user.id);
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
    username:     user.user_metadata?.username,
    provider:     user.app_metadata?.provider ?? 'email',
    totp_enabled: factors.some(f => f.status === 'verified'),
    factors,
    wallet,
  };
}
