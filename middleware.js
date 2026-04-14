import { NextResponse } from 'next/server';
import {
  getAdminSessionCookieName,
  verifyAdminSessionToken,
} from '@/features/shared/server/adminSession';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all /admin/* routes
  if (pathname.startsWith('/admin')) {
    // Allow the login page through
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminAuth = request.cookies.get(getAdminSessionCookieName())?.value;
    if (!(await verifyAdminSessionToken(adminAuth))) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
