'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../../shared/auth.module.css';

type Me = { id: string; role: 'client' | 'artisan' | 'admin'; email: string };

type Detail = {
  artisan: { id: string; business_name: string | null; bio: string | null; is_verified: boolean };
  services: Array<{ id: string; title: string; price_amount: any; category_name: string }>;
  service_areas: Array<{ id: string; area_name: string | null; radius_km: number; lat: number | null; lng: number | null }>;
};

export default function ArtisanProfileClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await apiFetch<Me>('/auth/me');
      if (m.role !== 'artisan') throw new Error('Compte non artisan');
      setMe(m);
      const d = await apiFetch<any>(`/artisans/${m.id}`);
      setDetail(d);
      setBusinessName(d.artisan.business_name || '');
      setBio(d.artisan.bio || '');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveProfile = async () => {
    await apiFetch(`/artisans/me/profile`, {
      method: 'PATCH',
      body: JSON.stringify({ business_name: businessName || null, bio: bio || null }),
    });
    await refresh();
  };

  const addArea = async () => {
    if (!navigator.geolocation) return alert('Géolocalisation non supportée');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await apiFetch(`/artisans/me/service-areas`, {
          method: 'POST',
          body: JSON.stringify({ area_name: 'Zone', lat: pos.coords.latitude, lng: pos.coords.longitude, radius_km: 10 }),
        });
        await refresh();
      },
      () => alert('Impossible de récupérer la position'),
    );
  };

  const [cats, setCats] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    apiFetch<Array<{ id: string; name: string }>>('/categories').then(setCats).catch(() => void 0);
  }, []);

  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(80);
  const [newServiceCat, setNewServiceCat] = useState<string>('');

  const canCreate = useMemo(() => newServiceTitle.trim().length > 2 && !!newServiceCat, [newServiceTitle, newServiceCat]);

  const createService = async () => {
    if (!canCreate) return;
    await apiFetch(`/artisan/services`, {
      method: 'POST',
      body: JSON.stringify({
        category_id: newServiceCat,
        title: newServiceTitle,
        description: null,
        price_type: 'starting_from',
        price_amount: newServicePrice,
        duration_minutes: 60,
        is_emergency_available: false,
        is_travel_included: true,
      }),
    });
    setNewServiceTitle('');
    await refresh();
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}><p>Chargement…</p></div>
      </div>
    );
  }

  if (error || !me || !detail) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Profil artisan</h1>
          <p className={styles.error}>Erreur: {error || 'Non connecté'}</p>
          <p><Link href="/login?next=/artisan/profile">Connexion</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Mon profil artisan</h1>
        <p className={styles.sub}>Compte: {me.email} • {detail.artisan.is_verified ? 'Vérifié ✅' : 'Non vérifié'}</p>

        <h3>Infos</h3>
        <div className={styles.form}>
          <label>
            Nom d’entreprise
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </label>
          <label>
            Description
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </label>
          <button className={styles.primary} type="button" onClick={saveProfile}>Enregistrer</button>
        </div>

        <h3>Zone</h3>
        <button type="button" onClick={addArea}>Ajouter une zone (ma position)</button>
        <ul>
          {detail.service_areas.map((z) => (
            <li key={z.id}>{z.area_name || 'Zone'} • rayon {z.radius_km} km</li>
          ))}
        </ul>

        <h3>Services</h3>
        <ul>
          {detail.services.map((s) => (
            <li key={s.id}>{s.title} • {s.category_name} • à partir de {s.price_amount}€</li>
          ))}
        </ul>

        <h4>Ajouter un service</h4>
        <div className={styles.form}>
          <label>
            Catégorie
            <select value={newServiceCat} onChange={(e) => setNewServiceCat(e.target.value)}>
              <option value="">Choisir…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Titre
            <input value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} placeholder="Installation, dépannage…" />
          </label>
          <label>
            Prix (à partir de)
            <input type="number" min={10} value={newServicePrice} onChange={(e) => setNewServicePrice(Number(e.target.value))} />
          </label>
          <button className={styles.primary} type="button" onClick={createService} disabled={!canCreate}>Ajouter</button>
        </div>

        <p style={{ marginTop: 16 }}>
          <Link href="/artisan/dashboard">← Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
