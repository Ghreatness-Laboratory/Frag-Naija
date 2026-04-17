import { NextResponse } from 'next/server';
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken,
} from '@/features/shared/server/adminSession';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── 1. Admin route protection ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const adminAuth = request.cookies.get(getAdminSessionCookieName())?.value;
    if (!(await verifyAdminSessionToken(adminAuth))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 2. Game-selection gate ────────────────────────────────────────────────
  // Skip API routes, Next.js internals, static assets, and the gate page itself
  const isInternal =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/logos/') ||
    pathname.startsWith('/select-game') ||
    pathname === '/favicon.ico';

  if (!isInternal) {
    const gameSelected = request.cookies.get('fn-game')?.value;
    if (!gameSelected) {
      return NextResponse.redirect(new URL('/select-game', request.url));
    }
  }

  // ── 3. Wager auth gate (TODO) ─────────────────────────────────────────────
  // Uncomment and implement once Supabase server-side session helper is ready:
  // if (pathname.startsWith('/wager')) {
  //   const session = await getSupabaseSession(request);
  //   if (!session) return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Match all pages except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
