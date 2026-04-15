import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    // Create client inside handler so build-time static analysis doesn't throw
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Check for enrolled 2FA factors
    const { supabaseAdmin } = await import('@/features/shared/server/supabaseAdmin');
    const { data: mfaData } = await supabaseAdmin.auth.admin.mfa.listFactors({ userId: data.user.id });
    const factors = (mfaData?.totp ?? []).filter(f => f.status === 'verified');
    const totp_enabled = factors.length > 0;

    const response = NextResponse.json({
      user:         data.user,
      access_token: data.session.access_token,
      totp_enabled,
      factors,
    });

    // Set session cookie for SSR (7-day expiry)
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
