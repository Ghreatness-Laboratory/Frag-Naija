import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set('admin_auth', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
