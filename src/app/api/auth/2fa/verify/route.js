import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { factorId, code } = await request.json();
    if (!factorId || !code) {
      return NextResponse.json({ error: 'factorId and code are required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use user-scoped client so MFA challenge runs as the user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) return NextResponse.json({ error: challengeError.message }, { status: 400 });

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Refresh session token after MFA verification
    const response = NextResponse.json({ ok: true });
    if (data?.session?.access_token) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 7,
        path:     '/',
      });
    }

    return response;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
