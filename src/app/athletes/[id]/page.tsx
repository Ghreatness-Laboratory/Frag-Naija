import type { Metadata } from 'next';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import AthletePageClient from './AthletePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fragnaija.com';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const athlete = await fetch(`${SITE_URL}/api/athletes/${params.id}`, { next: { revalidate: 120 } }).then(r => r.ok ? r.json() : null);
    if (athlete) {
      const name = athlete.known_name || athlete.ign || athlete.name;
      const gameName = athlete.game_slug ? athlete.game_slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Esports';
      const imageUrl = athlete.photo_url || '/og-image.svg';
      
      return pageMetadata({
        title: name,
        description: `${name} - ${gameName} ${athlete.role || 'Athlete'} on FragNaija. View stats, rankings, and profile.`,
        path: `/athletes/${params.id}`,
        image: absoluteUrl(imageUrl),
      });
    }
  } catch {}
  
  return pageMetadata({ title: 'Athlete Profile', description: 'View athlete profile on FragNaija.', path: `/athletes/${params.id}` });
}

export default function AthleteDetail({ params }: { params: { id: string } }) {
  return <AthletePageClient id={params.id} />;
}
