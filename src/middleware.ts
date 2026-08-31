import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_ORIGIN = 'https://fragnaija.com';

function isVercelDeploymentHost(hostname: string) {
  return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
}

function isNonCanonicalPublicHost(hostname: string) {
  return hostname === 'www.fragnaija.com';
}

export function middleware(request: NextRequest) {
  // Vercel deployment and preview URLs must not compete with the public
  // domain in search. Preserve the path and query string so valid shared
  // links still reach their canonical page.
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (isVercelDeploymentHost(hostname) || isNonCanonicalPublicHost(hostname)) {
    const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);
    const response = NextResponse.redirect(destination, 301);
    if (isVercelDeploymentHost(hostname)) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }

  const response = NextResponse.next();
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    // Keep the directive effective even if a crawler does not render the
    // admin layout (for example, when it receives an authentication response).
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
