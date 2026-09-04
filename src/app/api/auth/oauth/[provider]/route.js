import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const OAUTH_PROVIDERS = new Set(['google', 'discord', 'facebook']);

export async function GET(request, { params }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const provider = params.provider;

  if (!OAUTH_PROVIDERS.has(provider)) {
    return NextResponse.redirect(`${siteUrl}/login?error=unsupported_oauth_provider`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      ...(provider === 'google' ? { queryParams: { access_type: 'offline', prompt: 'consent' } } : {}),
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_init_failed`);
  }

  return NextResponse.redirect(data.url);
}
