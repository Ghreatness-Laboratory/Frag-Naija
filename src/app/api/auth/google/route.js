import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(`${siteUrl}/login?error=oauth_init_failed`);
  }

  return NextResponse.redirect(data.url);
}
