import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createWallet } from '@/features/wagers/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=missing_code`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=oauth_failed`);
  }

  // Ensure wallet exists for new OAuth users
  try { await createWallet(data.session.user.id); } catch {}

  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/`);
  response.cookies.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });

  return response;
}
