import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fragnaija.com';
  const isProduction = host.includes('fragnaija.com');
  
  // For non-production domains (like .vercel.app), block all crawling
  if (!isProduction) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host,
    };
  }
  
  // Production robots.txt for fragnaija.com
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/wallet', '/settings'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
