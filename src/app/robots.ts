import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const comingSoon = String(process.env.SITE_LAUNCH_MODE || '').toLowerCase() === 'coming_soon';
  if (comingSoon) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
        allow: ['/news', '/news/'],
      },
      sitemap: `${SITE_URL}/sitemap.xml`,
      host: SITE_URL,
    };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/wallet', '/settings', '/login', '/register', '/coming-soon'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
