import { NextResponse } from 'next/server';
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken,
} from '@/features/shared/server/adminSession';

function isComingSoonEnabled() {
  return String(process.env.SITE_LAUNCH_MODE || '').toLowerCase() === 'coming_soon';
}

function isStaticOrInternalAsset(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/logos/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/logo-icon.jpeg'
  );
}

function isComingSoonPublicRoute(pathname) {
  return (
    pathname.startsWith('/news') ||
    pathname.startsWith('/coming-soon') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/news') ||
    pathname.startsWith('/api/launch-settings') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/session') ||
    pathname.startsWith('/api/auth/admin/check')
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const adminAuth = request.cookies.get(getAdminSessionCookieName())?.value;
  const isAdmin = await verifyAdminSessionToken(adminAuth);

  // ── 0. Pre-launch coming-soon gate ───────────────────────────────────────
  if (isComingSoonEnabled() && !isAdmin && !isStaticOrInternalAsset(pathname) && !isComingSoonPublicRoute(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'FragNaija is coming soon. Public access is limited to News until launch.' }, { status: 403 });
    }

    return NextResponse.rewrite(new URL('/coming-soon', request.url));
  }

  // ── 1. Admin route protection ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    if (!isAdmin) {
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
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/select-game') ||
    pathname.startsWith('/offline') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico';

  if (!isInternal && !isAdmin) {
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
    /*
     * Match all paths EXCEPT:
     *  - Next.js internals (_next/static, _next/image, _next/webpack-hmr)
     *  - Static public assets (icons, logos, sw.js, manifest, favicon)
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
