import AdminFantasyMatchStatsClient from './AdminFantasyMatchStatsClient';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: { gameweekId: string; matchId: string } }) {
  return <AdminFantasyMatchStatsClient params={params} />;
}
