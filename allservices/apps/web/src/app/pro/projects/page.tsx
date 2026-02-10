'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ProCard = {
  id: string;
  name: string;
  city: string;
  categories: string[];
  rating: number;
  jobs: number;
};

const SAMPLE_PROS: ProCard[] = [
  {
    id: 'pro_1',
    name: 'Pro Plomberie IDF',
    city: 'Paris',
    categories: ['Plomberie', 'Rénovation'],
    rating: 4.8,
    jobs: 52,
  },
  {
    id: 'pro_2',
    name: 'Électricien Express',
    city: 'Massy',
    categories: ['Électricité'],
    rating: 4.6,
    jobs: 31,
  },
  {
    id: 'pro_3',
    name: 'Peinture & Finitions',
    city: 'Créteil',
    categories: ['Peinture', 'Menuiserie'],
    rating: 4.7,
    jobs: 44,
  },
];

export default function ProsPage() {
  const [token] = useState(() => getToken());
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // filtres V1
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => setEmail((u.email || '').toLowerCase()))
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token]);

  const styles = useMemo(
    () => ({
      page: { padding: 24, background: '#f8fafc', minHeight: 'calc(100vh - 64px)' },
      card: {
        maxWidth: 960,
        margin: '0 auto',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 18,
      },
      titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const },
      h1: { margin: 0, fontSize: 22, fontWeight: 900, color: '#0b1f3a' },
      small: { color: '#64748b', fontSize: 13, marginTop: 8 },

      grid: { marginTop: 14, display: 'grid', gap: 12 },
      item: {
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
      },
      left: { minWidth: 0 },
      name: { fontWeight: 900, color: '#0b1f3a', fontSize: 16 },
      meta: { color: '#64748b', fontWeight: 800, fontSize: 12, marginTop: 6 },
      badgeRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, marginTop: 10 },
      badge: {
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
        fontWeight: 800,
        color: '#334155',
        fontSize: 12,
      },
      inputRow: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
      input: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        fontSize: 14,
        outline: 'none',
      },
      link: { color: '#2563eb', fontWeight: 900, textDecoration: 'none' as const },
      btnGhost: {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#fff',
        fontWeight: 900,
        cursor: 'pointer' as const,
        textDecoration: 'none' as const,
        color: '#111',
      },
    }),
    [],
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Chercher un pro</h1>
          <p style={{ color: '#334155' }}>
            Tu dois être connecté.
            {' '}
            <Link href="/account" style={styles.link}>Aller au profil</Link>
          </p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Chercher un pro</h1>
          <div style={{ marginTop: 10, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
        </div>
      </div>
    );
  }

  const filtered = SAMPLE_PROS.filter((p) => {
    const qq = q.trim().toLowerCase();
    const cc = city.trim().toLowerCase();
    const matchQ =
      !qq ||
      p.name.toLowerCase().includes(qq) ||
      p.categories.some((c) => c.toLowerCase().includes(qq));
    const matchCity = !cc || p.city.toLowerCase().includes(cc);
    return matchQ && matchCity;
  });

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Chercher un pro</h1>
          <Link href="/projects/new" style={styles.btnGhost}>Créer un projet</Link>
        </div>

        <div style={styles.small}>
          Connecté en tant que <b>{email}</b>
        </div>

        <div style={styles.inputRow}>
          <input
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder="Métier (plomberie, électricité...)"
            style={styles.input}
          />
          <input
            value={city}
            onChange={(e) => setCity(e.currentTarget.value)}
            placeholder="Ville"
            style={styles.input}
          />
        </div>

        <div style={styles.grid}>
          {filtered.length === 0 ? (
            <div style={{ padding: 14, border: '1px dashed #cbd5e1', borderRadius: 14, background: '#fff', marginTop: 12 }}>
              Aucun professionnel trouvé (V1).
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} style={styles.item}>
                <div style={styles.left}>
                  <div style={styles.name}>{p.name}</div>
                  <div style={styles.meta}>
                    {p.city} • {p.rating.toFixed(1)} ★ • {p.jobs} prestations
                  </div>
                  <div style={styles.badgeRow}>
                    {p.categories.map((c) => (
                      <span key={c} style={styles.badge}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* V1: page profil pro non implémentée => lien placeholder */}
                <a href="#" style={styles.link} onClick={(e) => e.preventDefault()}>
                  Voir →
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
