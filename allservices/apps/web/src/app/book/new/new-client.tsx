'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from '../../shared/auth.module.css';

export default function NewBookingClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const artisan_id = sp.get('artisan_id') || '';
  const service_id = sp.get('service_id') || '';

  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [address1, setAddress1] = useState('');
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artisan_id || !service_id) {
      setError('Paramètres manquants. Reviens sur la fiche artisan.');
    }
  }, [artisan_id, service_id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const booking = await apiFetch<{ id: string }>(`/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          service_id,
          start_at: new Date(startAt).toISOString(),
          client_note: note || null,
          address: {
            address_line1: address1,
            postal_code: postal,
            city,
            country: 'FR',
            lat,
            lng,
          },
        }),
      });
      router.push(`/book/${booking.id}`);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Nouvelle réservation</h1>
        <p className={styles.sub}>Choisis un créneau et ajoute l’adresse d’intervention.</p>
        {error && <p className={styles.error}>Erreur: {error}</p>}

        <form onSubmit={submit} className={styles.form}>
          <label>
            Date & heure
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </label>
          <label>
            Adresse
            <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Rue, numéro…" required />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1 }}>
              Code postal
              <input value={postal} onChange={(e) => setPostal(e.target.value)} required />
            </label>
            <label style={{ flex: 1 }}>
              Ville
              <input value={city} onChange={(e) => setCity(e.target.value)} required />
            </label>
          </div>
          <label>
            Note (optionnel)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Détails, accès, urgence…" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return alert('Géolocalisation non supportée');
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setLat(pos.coords.latitude);
                  setLng(pos.coords.longitude);
                },
                () => alert('Impossible de récupérer la position'),
              );
            }}
          >
            Ajouter ma position (optionnel)
          </button>

          <button disabled={loading} className={styles.primary} type="submit">
            {loading ? 'Création…' : 'Continuer vers paiement'}
          </button>
        </form>

        <p className={styles.hint}>
          Si tu n’es pas connecté, va sur <Link href="/login?next=/account">Connexion</Link>.
        </p>
        <p><Link href={`/artisan/${artisan_id}`}>← Retour artisan</Link></p>
      </div>
    </div>
  );
}
