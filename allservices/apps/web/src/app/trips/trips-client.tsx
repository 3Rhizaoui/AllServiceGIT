'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './trips.module.css';

type Booking = {
  id: string;
  start_at: string;
  status: string;
  service_title: string;
  artisan_first_name: string | null;
  artisan_last_name: string | null;
};

export default function TripsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<Booking[]>('/bookings');
        setItems(res);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className={styles.wrap}><p>Chargement…</p></div>;

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Mes réservations</h1>
          <p className={styles.error}>Erreur: {error}</p>
          <p><Link href="/login?next=/trips">Connexion</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Mes réservations</h1>
        {items.length === 0 ? <p>Aucune réservation.</p> : (
          <div className={styles.list}>
            {items.map((b) => (
              <div key={b.id} className={styles.item}>
                <div className={styles.top}>
                  <b>{b.service_title}</b>
                  <span className={styles.status}>{b.status}</span>
                </div>
                <div className={styles.sub}>
                  {new Date(b.start_at).toLocaleString()} • {`${b.artisan_first_name ?? ''} ${b.artisan_last_name ?? ''}`.trim() || 'Artisan'}
                </div>
                <div className={styles.actions}>
                  <Link href={`/book/${b.id}`}>Voir / payer</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
