'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  formatEuro,
  labelCategory,
  listMyProjects,
  type Project,
} from '@/lib/projects-store';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const BLUE = '#2563eb';

export default function ProjectsPage() {
  const [email, setEmail] = useState<string>('');
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
      title: { fontSize: 22, fontWeight: 900, margin: 0, color: '#0b1f3a' },
      btnBlue: {
        padding: '10px 14px',
        borderRadius: 12,
        border: `1px solid ${BLUE}`,
        background: BLUE,
        color: '#fff',
        fontWeight: 900,
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
      },
      list: { marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
      item: {
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        background: '#fff',
      },
      badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #e5e7eb',
        fontWeight: 800,
        fontSize: 12,
        color: '#0f172a',
        background: '#f8fafc',
      },
      small: { color: '#475569', fontWeight: 700, fontSize: 13, marginTop: 6 },
      link: { color: BLUE, fontWeight: 900, textDecoration: 'none' as const },
      empty: {
        marginTop: 14,
        border: '1px dashed #cbd5e1',
        borderRadius: 14,
        padding: 16,
        background: '#f8fafc',
        color: '#334155',
        fontWeight: 700,
      },
      err: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #fecaca',
        background: '#fff1f2',
        color: '#991b1b',
        fontWeight: 800,
      },
    }),
    [],
  );

  async function load() {
    setError(null);

    const token = getToken();
    if (!token) {
      setError("Tu dois être connecté pour voir tes projets (va sur /account).");
      setItems([]);
      return;
    }

    try {
      const u = await me(token);
      const userEmail = (u?.email || '').toLowerCase();
      setEmail(userEmail);

      const mine = listMyProjects(userEmail);
      setItems(mine);
    } catch (e: any) {
      setError(String(e?.message || e || 'Erreur'));
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h1 style={styles.title}>Mes projets</h1>

          {/* Page /projects/new à faire ensuite (tu l’as listée dans l’objectif 1) */}
          <Link href="/projects/new" style={styles.btnBlue}>
            Créer un projet
          </Link>
        </div>

        {error ? <div style={styles.err}>{error}</div> : null}

        {!error && items.length === 0 ? (
          <div style={styles.empty}>
            Aucun projet pour l’instant.
            <div style={{ marginTop: 8 }}>
              <Link href="/projects/new" style={styles.link}>
                Créer mon premier projet
              </Link>
            </div>
          </div>
        ) : null}

        <div style={styles.list}>
          {items.map((p) => (
            <div key={p.id} style={styles.item}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#0b1f3a' }}>{p.title}</div>
                <div style={styles.badge}>{labelCategory(p.category)}</div>
              </div>

              <div style={styles.small}>
                {p.city} • {new Date(p.created_at).toLocaleDateString('fr-FR')}
                {typeof p.budget_min === 'number' || typeof p.budget_max === 'number' ? (
                  <> • Budget: {formatEuro(p.budget_min)} {p.budget_max ? `→ ${formatEuro(p.budget_max)}` : ''}</>
                ) : null}
              </div>

              <div style={{ marginTop: 10, color: '#334155', fontWeight: 700 }}>
                {p.description.length > 160 ? p.description.slice(0, 160) + '…' : p.description}
              </div>

              <div style={{ marginTop: 10 }}>
                <Link href={`/projects/${p.id}`} style={styles.link}>
                  Voir le détail →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {email ? (
          <div style={{ marginTop: 16, color: '#64748b', fontWeight: 700, fontSize: 12 }}>
            Connecté en tant que {email}
          </div>
        ) : null}
      </div>
    </div>
  );
}
