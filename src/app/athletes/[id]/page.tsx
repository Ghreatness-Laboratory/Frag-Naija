import type { Metadata } from 'next';
import AthletePageClient from './AthletePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fragnaija.com';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const athlete = await fetch(`${SITE_URL}/api/athletes/${params.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
    if (athlete) {
      const name = athlete.known_name || athlete.ign || athlete.name;
      const gameName = athlete.game_slug ? athlete.game_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Esports';
      const imageUrl = athlete.photo_url || '/og-image.svg';
      
      return {
        title: name,
        description: `${name} - ${gameName} ${athlete.role || 'Athlete'} on FragNaija. View stats, rankings, and profile.`,
        openGraph: {
          title: `${name} - FragNaija`,
          description: `${name} - ${gameName} ${athlete.role || 'Athlete'} on FragNaija.`,
          images: [{ url: imageUrl, width: 400, height: 400, alt: name }],
        },
        twitter: {
          title: `${name} - FragNaija`,
          description: `${name} - ${gameName} ${athlete.role || 'Athlete'} on FragNaija.`,
          images: [imageUrl],
          card: 'summary',
        },
      };
    }
  } catch {}
  
  return {
    title: 'Athlete Profile',
    description: 'View athlete profile on FragNaija.',
  };
}

export default function AthleteDetail({ params }: { params: { id: string } }) {
  return <AthletePageClient id={params.id} />;
}
