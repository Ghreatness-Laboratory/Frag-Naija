import OrganizationDetail from './OrganizationDetailClient';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: { id: string } }) {
  return <OrganizationDetail params={params} />;
}
