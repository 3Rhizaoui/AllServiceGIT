'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './detail.module.css';

type DetailResponse = {
  artisan: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    business_name: string | null;
    bio: string | null;
    years_experience: number | null;
    is_verified: boolean;
    rating_avg: number;
    reviews_count: number;
    base_travel_fee: string | number | null;
  };
  services: Array<{
    id: string;
    title: string;
    description: string | null;
    price_type: 'fixed' | 'starting_from' | 'hourly';
    price_amount: string | number;
    duration_minutes: number | null;
    category_name: string;
    category_slug: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
  }>;
  service_areas: Array<{ id: string; area_name: string | null; radius_km: number; lat: number | null; lng: number | null }>;
} | null;

export default function ArtisanDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DetailResponse>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<DetailResponse>(`/artisans/${id}`);
        setData(res);
        setSelectedServiceId(res?.services?.[0]?.id || null);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const selected = useMemo(() => data?.services?.find((s) => s.id === selectedServiceId) || null, [data, selectedServiceId]);

  if (loading) return <div className={styles.wrap}><p>Chargement…</p></div>;
  if (error || !data) return <div className={styles.wrap}><p className={styles.error}>Erreur: {error || 'Artisan introuvable'}</p></div>;

  const a = data.artisan;
  const name = a.business_name || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || 'Artisan';

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatar} aria-hidden>
          {a.avatar_url ? <img src={a.avatar_url} alt="" /> : <span>{name[0]?.toUpperCase() || 'A'}</span>}
        </div>
        <div className={styles.main}>
          <h1 className={styles.title}>{name}</h1>
          <div className={styles.meta}>
            <span>⭐ {Number(a.rating_avg).toFixed(1)} ({a.reviews_count} avis)</span>
            {a.is_verified && <span className={styles.badge}>Vérifié</span>}
            {a.years_experience ? <span>{a.years_experience} ans d'expérience</span> : null}
          </div>
          {a.bio && <p className={styles.bio}>{a.bio}</p>}
          <div className={styles.links}>
            <Link href="/search">← Retour recherche</Link>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Services</h2>
          <div className={styles.services}>
            {data.services.map((s) => (
              <button
                key={s.id}
                className={s.id === selectedServiceId ? styles.serviceActive : styles.service}
                onClick={() => setSelectedServiceId(s.id)}
              >
                <div className={styles.serviceTitle}>{s.title}</div>
                <div className={styles.serviceSub}>
                  {s.category_name} • {s.price_type === 'hourly' ? 'à l’heure' : s.price_type === 'starting_from' ? 'à partir de' : 'fixe'} • {s.price_amount}€
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h2>Réserver</h2>
            {selected ? (
              <>
                <p className={styles.small}><b>Service :</b> {selected.title}</p>
                <p className={styles.small}><b>Prix :</b> {selected.price_amount}€ {selected.price_type === 'hourly' ? '/h' : ''}</p>
                <button
                  className={styles.primary}
                  onClick={() => {
                    const sp = new URLSearchParams();
                    sp.set('artisan_id', a.id);
                    sp.set('service_id', selected.id);
                    router.push(`/book/new?${sp.toString()}`);
                  }}
                >
                  Démarrer une réservation
                </button>
                <p className={styles.hint}>Paiement sécurisé (Stripe) – mode test.</p>
              </>
            ) : (
              <p>Aucun service disponible.</p>
            )}
          </div>

          <div className={styles.card}>
            <h2>Zone</h2>
            {data.service_areas.length === 0 ? <p>Zone non renseignée.</p> : (
              <ul className={styles.list}>
                {data.service_areas.map((z) => (
                  <li key={z.id}>{z.area_name || 'Zone'} • rayon {z.radius_km} km</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className={styles.card}>
        <h2>Avis</h2>
        {data.reviews.length === 0 ? <p>Aucun avis pour le moment.</p> : (
          <div className={styles.reviews}>
            {data.reviews.map((r) => (
              <div key={r.id} className={styles.review}>
                <div className={styles.reviewTop}>
                  <span>⭐ {r.rating}</span>
                  <span className={styles.reviewName}>{`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'Client'}</span>
                  <span className={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
