import { NextResponse } from 'next/server';
import { createWallet } from '@/features/wagers/server';
import { supabaseAdmin } from '@/features/shared/server/supabaseAdmin';

export async function POST(request) {
  try {
    const { access_token } = await request.json();
    if (!access_token) return NextResponse.json({ error: 'No token' }, { status: 400 });

    // Verify the token is valid
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Ensure wallet exists for OAuth users
    try { await createWallet(user.id); } catch {}

    const response = NextResponse.json({ ok: true });
    response.cookies.set('sb-access-token', access_token, {
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
