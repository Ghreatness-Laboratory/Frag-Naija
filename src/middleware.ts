import { NextRequest, NextResponse } from 'next/server';

const CANONICAL_ORIGIN = 'https://fragnaija.com';

function isVercelDeploymentHost(hostname: string) {
  return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
}

export function middleware(request: NextRequest) {
  // Only redirect Vercel-generated deployment hosts here. The public apex/www
  // relationship is managed at Vercel's domain layer; duplicating it in
  // middleware can fight a dashboard-level redirect and create an apex <-> www
  // loop that takes the custom domain offline. Preserve the path and query
  // string so valid shared preview links still reach their canonical page.
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (isVercelDeploymentHost(hostname)) {
    const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, CANONICAL_ORIGIN);
    const response = NextResponse.redirect(destination, 301);
    if (isVercelDeploymentHost(hostname)) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
