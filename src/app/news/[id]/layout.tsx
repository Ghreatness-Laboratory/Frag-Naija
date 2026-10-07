import { getNewsById } from '@/features/news/server';
import { absoluteUrl, pageMetadata, SITE_NAME } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const article = await getNewsById(params.id);
    return pageMetadata({
      title: article.title || 'News Article',
      description: article.excerpt,
      path: `/news/${params.id}`,
      image: article.image_url || undefined,
      type: 'article',
    });
  } catch {
    return pageMetadata({ title: 'News Article', path: `/news/${params.id}`, type: 'article' });
  }
}

export default async function NewsArticleLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  let jsonLd = null;
  try {
    const article = await getNewsById(params.id);
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      image: absoluteUrl(article.image_url || '/og-image.svg'),
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at || article.published_at || article.created_at,
      author: { '@type': 'Person', name: article.author || `${SITE_NAME} Desk` },
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/fn-badge.svg') } },
      mainEntityOfPage: absoluteUrl(`/news/${params.id}`),
    };
  } catch {}

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      {children}
    </>
  );
}
