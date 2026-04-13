import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect all /admin/* routes
  if (pathname.startsWith('/admin')) {
    // Allow the login page through
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminAuth = request.cookies.get('admin_auth')?.value;
    if (!adminAuth || adminAuth !== process.env.ADMIN_PASSWORD) {
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
