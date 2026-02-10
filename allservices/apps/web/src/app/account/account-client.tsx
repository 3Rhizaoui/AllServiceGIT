'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch, setToken } from '@/lib/api';
import styles from './account.module.css';

type Me = { id: string; email: string; role: 'client' | 'artisan' | 'admin'; first_name: string | null; last_name: string | null };

export default function AccountClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<Me>('/auth/me');
        setMe(res);
      } catch (e: any) {
        setMe(null);
        setError(e.message || 'Non connecté');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className={styles.wrap}><p>Chargement…</p></div>;

  if (!me) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Compte</h1>
          <p className={styles.sub}>Connecte-toi pour accéder à tes réservations.</p>
          {error && <p className={styles.error}>Info: {error}</p>}
          <div className={styles.row}>
            <Link className={styles.primary} href={`/login?next=/account`}>Connexion</Link>
            <Link className={styles.secondary} href={`/signup`}>Créer un compte</Link>
          </div>
        </div>
      </div>
    );
  }

  const name = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim() || me.email;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Mon compte</h1>
        <p className={styles.sub}><b>{name}</b> • {me.role}</p>

        <div className={styles.links}>
          <Link href="/trips">Mes réservations</Link>
          {me.role === 'artisan' && <Link href="/artisan/dashboard">Espace artisan</Link>}
          {me.role === 'artisan' && <Link href="/artisan/profile">Profil artisan</Link>}
        </div>

        <button
          className={styles.logout}
          onClick={() => {
            setToken(null);
            router.push('/');
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
