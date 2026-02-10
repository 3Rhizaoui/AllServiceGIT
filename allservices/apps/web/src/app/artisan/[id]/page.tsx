import ArtisanDetailClient from './detail-client';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: { id: string } }) {
  return <ArtisanDetailClient id={params.id} />;
}
