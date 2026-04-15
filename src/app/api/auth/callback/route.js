import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createWallet } from '@/features/wagers/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code  = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${siteUrl}/login?error=${error || 'missing_code'}`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data?.session) {
    console.error('OAuth exchange error:', exchangeError?.message);
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_failed`);
  }

  // Ensure wallet exists for new OAuth users
  try { await createWallet(data.session.user.id); } catch {}

  const response = NextResponse.redirect(`${siteUrl}/`);
  response.cookies.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });

  return response;
}
