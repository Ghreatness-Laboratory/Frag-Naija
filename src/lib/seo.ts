import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fragnaija.com';
export const SITE_NAME = 'FragNaija';
export const SITE_TAGLINE = 'Everything Esports - One Platform';
export const DEFAULT_DESCRIPTION = SITE_TAGLINE;
export const OG_IMAGE_PATH = '/og-image.svg';
export const APP_ICON_PATH = '/icons/fn-badge.svg';

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = OG_IMAGE_PATH,
  type = 'website',
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || OG_IMAGE_PATH);
  const titleText = `${title} - ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: titleText,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${titleText} | ${SITE_TAGLINE}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description,
      images: [imageUrl],
    },
  };
}
