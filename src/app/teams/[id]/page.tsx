import type { Metadata } from 'next';
import TeamPageClient from './TeamPageClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const team = await fetch(`${siteUrl}/api/teams/${params.id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
    if (team) {
      const imageUrl = team.logo_url || '/og-image.svg';
      const gameName = team.game_slug ? team.game_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Esports';
      
      return {
        title: team.name,
        description: `${team.name} - ${gameName} esports team on FragNaija. View roster, stats, and rankings.`,
        openGraph: {
          title: `${team.name} | FragNaija`,
          description: `${team.name} - ${gameName} esports team on FragNaija.`,
          images: [{ url: imageUrl, width: 400, height: 400, alt: team.name }],
        },
        twitter: {
          title: `${team.name} | FragNaija`,
          description: `${team.name} - ${gameName} esports team on FragNaija.`,
          images: [imageUrl],
          card: 'summary',
        },
      };
    }
  } catch {}
  
  return {
    title: 'Team Profile',
    description: 'View team profile on FragNaija.',
  };
}

export default function TeamDetail({ params }: { params: { id: string } }) {
  return <TeamPageClient id={params.id} />;
}
