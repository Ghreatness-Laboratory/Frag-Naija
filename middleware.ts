import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTE_PREFIXES = [
  '/athletes',
  '/teams',
  '/tournaments',
  '/organizations',
  '/transfer-window',
  '/communities',
  '/shop',
  '/highlights',
  '/wager',
  '/wallet',
  '/security',
  '/select-game',
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('sb-access-token')?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/athletes/:path*',
    '/teams/:path*',
    '/tournaments/:path*',
    '/organizations/:path*',
    '/transfer-window/:path*',
    '/communities/:path*',
    '/shop/:path*',
    '/highlights/:path*',
    '/wager/:path*',
    '/wallet/:path*',
    '/security/:path*',
    '/select-game/:path*',
  ],
};
