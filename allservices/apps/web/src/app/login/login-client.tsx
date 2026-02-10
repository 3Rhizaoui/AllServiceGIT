'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, setToken } from '@/lib/api';
import styles from '../shared/auth.module.css';

export default function AuthLoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ access_token: string }>(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      router.push(next);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Connexion</h1>
        <p className={styles.sub}>Accède à tes réservations et à ton compte.</p>
        {error && <p className={styles.error}>Erreur: {error}</p>}
        <form onSubmit={submit} className={styles.form}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Mot de passe
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <button disabled={loading} className={styles.primary} type="submit">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <div className={styles.footer}>
          <span>Pas de compte ?</span> <Link href="/signup">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}
