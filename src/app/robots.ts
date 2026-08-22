import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const comingSoon = process.env.NEXT_PUBLIC_COMING_SOON === 'true' || process.env.COMING_SOON === 'true';
  if (comingSoon) {
    return { rules: { userAgent: '*', disallow: '/' }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/wallet', '/settings', '/login', '/register', '/coming-soon'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
