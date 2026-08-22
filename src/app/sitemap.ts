import type { MetadataRoute } from 'next';
import { getAllNews } from '@/features/news/server';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SitemapNewsArticle = { id: string; updated_at?: string | null; published_at?: string | null; created_at?: string | null };
type NewsListWithPublished = (options: { published: boolean }) => Promise<SitemapNewsArticle[]>;

const staticRoutes = ['', '/news', '/athletes', '/teams', '/about', '/games', '/tournaments', '/wager', '/fantasy-league', '/gaming-alerts', '/custom-wager'];
const getPublishedNews = getAllNews as NewsListWithPublished;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({ url: `${SITE_URL}${route}`, lastModified: now, changeFrequency: route === '' ? 'daily' : 'weekly', priority: route === '' ? 1 : 0.8 }));
  try {
    const articles = await getPublishedNews({ published: true });
    entries.push(...articles.map((article) => ({ url: `${SITE_URL}/news/${article.id}`, lastModified: new Date(article.updated_at || article.published_at || article.created_at || now), changeFrequency: 'weekly' as const, priority: 0.7 })));
  } catch {
    // Keep static URLs available if the news backend is unavailable during build/runtime.
  }
  return entries;
}
