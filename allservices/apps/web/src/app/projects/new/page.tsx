'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { createProject, type ProjectCategory } from '@/lib/projects-store';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const CATS: { value: ProjectCategory; label: string }[] = [
  { value: 'renovation', label: 'Rénovation' },
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'autre', label: 'Autre' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [token] = useState(() => getToken());
  const [ownerEmail, setOwnerEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('renovation');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => setOwnerEmail((u.email || '').toLowerCase()))
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token]);

  const styles = useMemo(
    () => ({
      page: { padding: 24, background: '#f8fafc', minHeight: 'calc(100vh - 64px)' },
      card: {
        maxWidth: 720,
        margin: '0 auto',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 18,
      },
      h1: { margin: 0, fontSize: 22, fontWeight: 900, color: '#0b1f3a' },
      label: { marginTop: 12, fontWeight: 900, fontSize: 13, color: '#334155' },
      input: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        marginTop: 8,
        fontSize: 14,
      },
      blueBtn: {
        width: '100%',
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #2563eb',
        background: '#2563eb',
        color: '#fff',
        fontWeight: 900,
        cursor: 'pointer',
        fontSize: 14,
      },
      ghostBtn: {
        width: '100%',
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#fff',
        color: '#111',
        fontWeight: 900,
        cursor: 'pointer',
        fontSize: 14,
      },
    }),
    [],
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Nouveau projet</h1>
          <p style={{ color: '#334155' }}>Tu dois être connecté pour créer un projet.</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Nouveau projet</h1>
          <div style={{ marginTop: 10, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
        </div>
      </div>
    );
  }

  async function onCreate() {
    setErr(null);
    setInfo(null);
    try {
      const p = createProject({
        ownerEmail,
        title,
        category,
        city,
        description,
      });
      setInfo('Projet créé ✅');
      router.push(`/projects/${p.id}`);
    } catch (e: any) {
      setErr(String(e?.message || e || 'Erreur'));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Nouveau projet</h1>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
          Propriétaire: <b>{ownerEmail}</b>
        </div>

        {info ? (
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 12 }}>
            {info}
          </div>
        ) : null}

        {err ? (
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
        ) : null}

        <div style={styles.label}>Titre</div>
        <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} style={styles.input} />

        <div style={styles.label}>Catégorie</div>
        <select value={category} onChange={(e) => setCategory(e.currentTarget.value as any)} style={styles.input}>
          {CATS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div style={styles.label}>Ville</div>
        <input value={city} onChange={(e) => setCity(e.currentTarget.value)} style={styles.input} />

        <div style={styles.label}>Description</div>
        <textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} style={{ ...styles.input, minHeight: 120 }} />

        <button onClick={onCreate} style={styles.blueBtn}>
          Publier l’appel d’offre
        </button>

        <button onClick={() => router.push('/projects')} style={styles.ghostBtn}>
          Retour
        </button>
      </div>
    </div>
  );
}
