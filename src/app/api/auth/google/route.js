import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // Redirect to the client-side OAuth handler page
  return NextResponse.redirect(`${siteUrl}/auth/google`);
}
