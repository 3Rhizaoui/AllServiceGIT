import Link from 'next/link';
import styles from './ArtisanCard.module.css';

export type ArtisanListItem = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  bio?: string | null;
  is_verified: boolean;
  rating_avg: number;
  reviews_count: number;
  min_price?: string | number | null;
  distance_km?: number | null;
};

export function ArtisanCard({ artisan }: { artisan: ArtisanListItem }) {
  const a = artisan;
  const name = a.business_name || [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Artisan';
  return (
    <Link href={`/artisan/${a.id}`} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.name}>{name}</div>
        {a.is_verified ? <span className={styles.badge}>Vérifié</span> : null}
      </div>
      <div className={styles.meta}>
        <span>⭐ {Number(a.rating_avg || 0).toFixed(1)} ({a.reviews_count || 0})</span>
        {a.distance_km != null ? <span>{a.distance_km.toFixed(1)} km</span> : null}
      </div>
      <div className={styles.price}>À partir de {a.min_price ?? '—'} €</div>
      <div className={styles.bio}>{a.bio || '—'}</div>
    </Link>
  );
}
