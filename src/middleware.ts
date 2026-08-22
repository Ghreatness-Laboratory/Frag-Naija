import { NextResponse } from 'next/server';
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
