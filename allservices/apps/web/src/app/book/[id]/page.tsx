import BookingPayClient from './pay-client';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: { id: string } }) {
  return <BookingPayClient id={params.id} />;
}
