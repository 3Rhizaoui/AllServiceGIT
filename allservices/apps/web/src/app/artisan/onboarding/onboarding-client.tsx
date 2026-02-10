'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../../shared/auth.module.css';

type Me = { id: string; role: 'client' | 'artisan' | 'admin'; email: string };

export default function OnboardingClient() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');

  const [serviceTitle, setServiceTitle] = useState('Dépannage');
  const [category, setCategory] = useState('plomberie');
  const [priceType, setPriceType] = useState<'fixed' | 'starting_from' | 'hourly'>('starting_from');
  const [priceAmount, setPriceAmount] = useState(60);

  const [radiusKm, setRadiusKm] = useState(10);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const m = await apiFetch<Me>('/auth/me');
        setMe(m);
      } catch (e: any) {
        setError(e.message || 'Non connecté');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!me) throw new Error('Non connecté');
      if (me.role !== 'artisan') throw new Error('Ce compte n’est pas un artisan');

      // 1) profil
      await apiFetch(`/artisans/me/profile`, {
        method: 'PATCH',
        body: JSON.stringify({ business_name: businessName || null, bio: bio || null }),
      });

      // 2) zone (centre + rayon)
      if (lat === null || lng === null) throw new Error('Ajoute ta position (centre de zone)');
      await apiFetch(`/artisans/me/service-areas`, {
        method: 'POST',
        body: JSON.stringify({ area_name: 'Zone principale', lat, lng, radius_km: radiusKm }),
      });

      // 3) service
      const cats = await apiFetch<Array<{ id: string; slug: string }>>('/categories');
      const cat = cats.find((c) => c.slug === category);
      if (!cat) throw new Error('Catégorie introuvable');
      await apiFetch(`/artisan/services`, {
        method: 'POST',
        body: JSON.stringify({
          category_id: cat.id,
          title: serviceTitle,
          description: null,
          price_type: priceType,
          price_amount: priceAmount,
          duration_minutes: 60,
          is_emergency_available: false,
          is_travel_included: true,
        }),
      });

      router.push('/artisan/dashboard');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}><p>Chargement…</p></div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Onboarding artisan</h1>
          <p className={styles.error}>Erreur: {error || 'Non connecté'}</p>
          <p><Link href="/login?next=/artisan/onboarding">Connexion</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Configurer mon profil artisan</h1>
        <p className={styles.sub}>3 étapes : profil • zone • 1er service. (MVP)</p>
        {error && <p className={styles.error}>Erreur: {error}</p>}

        <form onSubmit={save} className={styles.form}>
          <h3>1) Profil</h3>
          <label>
            Nom d’entreprise (optionnel)
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Plomberie Martin" />
          </label>
          <label>
            Description
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Dépannage, installation…" />
          </label>

          <h3>2) Zone d’intervention (centre + rayon)</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: 160 }}>
              Rayon (km)
              <input type="number" min={1} max={30} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
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
              Utiliser ma position
            </button>
          </div>
          <p className={styles.hint}>Position actuelle enregistrée : {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '—'}</p>

          <h3>3) Premier service</h3>
          <label>
            Catégorie
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="plomberie">Plomberie</option>
              <option value="electricite">Électricité</option>
              <option value="serrurerie">Serrurerie</option>
              <option value="peinture">Peinture</option>
            </select>
          </label>
          <label>
            Titre du service
            <input value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1 }}>
              Type de prix
              <select value={priceType} onChange={(e) => setPriceType(e.target.value as any)}>
                <option value="starting_from">À partir de</option>
                <option value="fixed">Fixe</option>
                <option value="hourly">Horaire</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Montant (€)
              <input type="number" min={10} value={priceAmount} onChange={(e) => setPriceAmount(Number(e.target.value))} />
            </label>
          </div>

          <button disabled={saving} className={styles.primary} type="submit">
            {saving ? 'Enregistrement…' : 'Publier mon profil'}
          </button>
        </form>

        <p><Link href="/account">← Mon compte</Link></p>
      </div>
    </div>
  );
}
