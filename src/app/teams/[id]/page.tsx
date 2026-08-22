import type { Metadata } from 'next';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import TeamPageClient from './TeamPageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fragnaija.com';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const team = await fetch(`${SITE_URL}/api/teams/${params.id}`, { next: { revalidate: 120 } }).then(r => r.ok ? r.json() : null);
    if (team) {
      const imageUrl = team.logo_url || '/og-image.svg';
      const gameName = team.game_slug ? team.game_slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Esports';
      
      return pageMetadata({
        title: team.name,
        description: `${team.name} - ${gameName} esports team on FragNaija. View roster, stats, and rankings.`,
        path: `/teams/${params.id}`,
        image: absoluteUrl(imageUrl),
      });
    }
  } catch {}
  
  return pageMetadata({ title: 'Team Profile', description: 'View team profile on FragNaija.', path: `/teams/${params.id}` });
}

export default function TeamDetail({ params }: { params: { id: string } }) {
  return <TeamPageClient id={params.id} />;
}
