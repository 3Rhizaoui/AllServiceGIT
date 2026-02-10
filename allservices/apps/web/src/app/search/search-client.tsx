'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArtisanCard } from '@/components/ArtisanCard';
import { MapView } from '@/components/MapView';
import styles from './search.module.css';

type ArtisanListItem = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  business_name: string | null;
  bio: string | null;
  is_verified: boolean;
  rating_avg: number;
  reviews_count: number;
  distance_km: number | null;
  lat: number | null;
  lng: number | null;
  min_price: string | number | null;
};

type ListResponse = { page: number; limit: number; items: ArtisanListItem[] };

function toNum(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function SearchPageClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [showMap, setShowMap] = useState(true);

  const query = useMemo(() => {
    const category = params.get('category') || '';
    const lat = params.get('lat');
    const lng = params.get('lng');
    const radius_km = params.get('radius_km') || '10';
    const price_min = params.get('price_min') || '';
    const price_max = params.get('price_max') || '';
    const rating_min = params.get('rating_min') || '';
    const verified = params.get('verified') || '';
    const sort = params.get('sort') || 'distance';
    return { category, lat, lng, radius_km, price_min, price_max, rating_min, verified, sort };
  }, [params]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (query.category) qs.set('category', query.category);
        if (query.lat && query.lng) {
          qs.set('lat', query.lat);
          qs.set('lng', query.lng);
          qs.set('radius_km', query.radius_km);
        }
        if (query.price_min) qs.set('price_min', query.price_min);
        if (query.price_max) qs.set('price_max', query.price_max);
        if (query.rating_min) qs.set('rating_min', query.rating_min);
        if (query.verified) qs.set('verified', query.verified);
        if (query.sort) qs.set('sort', query.sort);

        const res = await apiFetch<ListResponse>(`/artisans?${qs.toString()}`);
        setData(res);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  const onToggleVerified = () => {
    const next = new URLSearchParams(params.toString());
    const cur = next.get('verified');
    if (cur === 'true') next.delete('verified');
    else next.set('verified', 'true');
    router.push(`/search?${next.toString()}`);
  };

  const onChange = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/search?${next.toString()}`);
  };

  const pins = (data?.items || [])
    .filter((x) => typeof x.lat === 'number' && typeof x.lng === 'number')
    .map((x) => ({
      id: x.id,
      name: x.business_name || `${x.first_name ?? ''} ${x.last_name ?? ''}`.trim(),
      lat: x.lat as number,
      lng: x.lng as number,
    }));

  const center = (() => {
    const lat = toNum(query.lat);
    const lng = toNum(query.lng);
    if (lat !== undefined && lng !== undefined) return { lat, lng };
    // Paris par défaut
    return { lat: 48.8566, lng: 2.3522 };
  })();

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          <select value={query.category} onChange={(e) => onChange('category', e.target.value)}>
            <option value="">Tous métiers</option>
            <option value="plomberie">Plomberie</option>
            <option value="electricite">Électricité</option>
            <option value="serrurerie">Serrurerie</option>
            <option value="peinture">Peinture</option>
          </select>

          <select value={query.sort} onChange={(e) => onChange('sort', e.target.value)}>
            <option value="distance">Trier: distance</option>
            <option value="rating">Trier: note</option>
            <option value="price">Trier: prix</option>
            <option value="newest">Trier: récent</option>
          </select>

          <button className={styles.chipBtn} onClick={onToggleVerified}>
            {query.verified === 'true' ? 'Vérifiés ✓' : 'Vérifiés'}
          </button>

          <button className={styles.chipBtn} onClick={() => setShowMap((v) => !v)}>
            {showMap ? 'Masquer carte' : 'Afficher carte'}
          </button>
        </div>

        <div className={styles.filters}>
          <label>
            Rayon (km)
            <input
              type="number"
              min={1}
              max={30}
              value={query.radius_km}
              onChange={(e) => onChange('radius_km', e.target.value)}
            />
          </label>
          <label>
            Prix min
            <input type="number" value={query.price_min} onChange={(e) => onChange('price_min', e.target.value)} />
          </label>
          <label>
            Prix max
            <input type="number" value={query.price_max} onChange={(e) => onChange('price_max', e.target.value)} />
          </label>
          <label>
            Note min
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={query.rating_min}
              onChange={(e) => onChange('rating_min', e.target.value)}
            />
          </label>
        </div>

        <div className={styles.geo}>
          <button
            className={styles.geoBtn}
            onClick={() => {
              if (!navigator.geolocation) return alert('Géolocalisation non supportée');
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const next = new URLSearchParams(params.toString());
                  next.set('lat', String(pos.coords.latitude));
                  next.set('lng', String(pos.coords.longitude));
                  if (!next.get('radius_km')) next.set('radius_km', '10');
                  router.push(`/search?${next.toString()}`);
                },
                () => alert('Impossible de récupérer la position'),
              );
            }}
          >
            Utiliser ma position
          </button>
          <span className={styles.geoHint}>Astuce: pour la vraie “distance”, active la position.</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.list}>
          {loading && <p>Chargement…</p>}
          {error && <p className={styles.error}>Erreur: {error}</p>}
          {!loading && !error && data?.items?.length === 0 && <p>Aucun artisan trouvé.</p>}
          {(data?.items || []).map((a) => (
            <ArtisanCard key={a.id} artisan={a} />
          ))}
        </div>

        {showMap && (
          <div className={styles.map}>
            <MapView center={center} pins={pins} onMarkerClick={(id) => router.push(`/artisan/${id}`)} />
          </div>
        )}
      </div>
    </div>
  );
}
