'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './dashboard.module.css';

type Booking = {
  id: string;
  status: string;
  start_at: string;
  service_title: string;
  client_first_name: string | null;
  client_last_name: string | null;
};

export default function ArtisanDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Booking[]>([]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Booking[]>('/artisan/bookings');
      setItems(res);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const action = async (id: string, verb: 'accept' | 'reject' | 'complete') => {
    await apiFetch(`/artisan/bookings/${id}/${verb}`, { method: 'POST' });
    await refresh();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1>Espace artisan</h1>
        <div className={styles.nav}>
          <Link href="/artisan/profile">Profil</Link>
          <Link href="/search">Voir la recherche</Link>
          <Link href="/account">Compte</Link>
        </div>
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className={styles.error}>Erreur: {error} (connecte-toi en artisan)</p>}

      <div className={styles.grid}>
        {(items || []).map((b) => (
          <div key={b.id} className={styles.card}>
            <div className={styles.top}>
              <b>{b.service_title}</b>
              <span className={styles.status}>{b.status}</span>
            </div>
            <div className={styles.sub}>
              {new Date(b.start_at).toLocaleString()} • {`${b.client_first_name ?? ''} ${b.client_last_name ?? ''}`.trim() || 'Client'}
            </div>

            <div className={styles.actions}>
              {b.status === 'pending' && (
                <>
                  <button onClick={() => action(b.id, 'accept')}>Accepter</button>
                  <button onClick={() => action(b.id, 'reject')}>Refuser</button>
                </>
              )}
              {b.status === 'accepted' && <button onClick={() => action(b.id, 'complete')}>Marquer terminé</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
