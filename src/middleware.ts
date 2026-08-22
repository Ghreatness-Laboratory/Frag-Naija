import { NextRequest, NextResponse } from 'next/server';
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken,
} from '@/features/shared/server/adminSession';

function isComingSoonEnabled() {
  return String(process.env.SITE_LAUNCH_MODE || '').toLowerCase() === 'coming_soon';
}

function isStaticOrInternalAsset(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/logos/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/og-image.svg'
  );
}

function isComingSoonPublicRoute(pathname: string) {
  return (
    pathname === '/coming-soon' ||
    pathname.startsWith('/coming-soon/') ||
    pathname === '/news' ||
    pathname.startsWith('/news/') ||
    pathname.startsWith('/api/news') ||
    pathname.startsWith('/api/launch-settings') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api/auth/admin')
  );
}

function comingSoonApiResponse() {
  return NextResponse.json(
    { error: 'FragNaija is coming soon. Public access is limited to News until launch.' },
    { status: 403 }
  );
}

function comingSoonRedirect(request: NextRequest) {
  const comingSoonUrl = request.nextUrl.clone();
  comingSoonUrl.pathname = '/coming-soon';
  comingSoonUrl.search = '';
  return NextResponse.redirect(comingSoonUrl);
}

async function isAdminRequest(request: NextRequest) {
  const adminAuth = request.cookies.get(getAdminSessionCookieName())?.value;
  return verifyAdminSessionToken(adminAuth);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = await isAdminRequest(request);

  if (isComingSoonEnabled() && !isAdmin && !isStaticOrInternalAsset(pathname) && !isComingSoonPublicRoute(pathname)) {
    if (pathname.startsWith('/api/')) {
      return comingSoonApiResponse();
    }

    return comingSoonRedirect(request);
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    if (!isAdmin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
