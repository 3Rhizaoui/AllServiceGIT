'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch, setToken } from '@/lib/api';
import styles from '../shared/auth.module.css';

export default function AuthSignupClient() {
  const router = useRouter();
  const [role, setRole] = useState<'client' | 'artisan'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ access_token: string }>(`/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password, role, first_name: firstName, last_name: lastName }),
      });
      setToken(res.access_token);
      router.push(role === 'artisan' ? '/artisan/onboarding' : '/account');
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Créer un compte</h1>
        <p className={styles.sub}>Client ou Artisan – tu peux démarrer en 1 minute.</p>
        {error && <p className={styles.error}>Erreur: {error}</p>}
        <form onSubmit={submit} className={styles.form}>
          <label>
            Je suis
            <select value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="client">Client</option>
              <option value="artisan">Artisan</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1 }}>
              Prénom
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label style={{ flex: 1 }}>
              Nom
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Mot de passe
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <button disabled={loading} className={styles.primary} type="submit">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <p className={styles.hint}>Astuce: pour un MVP, on garde l’auth simple (email + mot de passe). OTP SMS plus tard.</p>
        <div className={styles.footer}>
          <span>Déjà un compte ?</span> <Link href="/login">Connexion</Link>
        </div>
      </div>
    </div>
  );
}
