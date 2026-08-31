import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isVercelPreview = host.includes('.vercel.app');
  
  // For .vercel.app preview domains: add noindex headers and disallow crawling
  if (isVercelPreview) {
    const response = NextResponse.next();
    
    // Add noindex headers to prevent search engines from indexing preview URLs
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|icons|logos|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)',
  ],
};
