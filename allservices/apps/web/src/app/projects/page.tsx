'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { labelCategory, listMyProjects, type Project } from '@/lib/projects-store';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProjectsPage() {
  const [token] = useState(() => getToken());
  const [email, setEmail] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Project[]>([]);

  useEffect(() => {
    let alive = true;
    if (!token) return;

    (async () => {
      try {
        const u = await me(token);
        const e = String(u.email || '').toLowerCase();
        if (!alive) return;
        setEmail(e);
        setItems(listMyProjects(e));
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e || 'Erreur'));
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  const styles = {
    page: { padding: 24, background: '#f8fafc', minHeight: 'calc(100vh - 64px)' },
    card: {
      maxWidth: 960,
      margin: '0 auto',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: 18,
    },
    titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    h1: { margin: 0, fontSize: 22, fontWeight: 900, color: '#0b1f3a' },
    blueBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 14px',
      borderRadius: 12,
      border: '1px solid #2563eb',
      background: '#2563eb',
      color: '#fff',
      fontWeight: 900,
      textDecoration: 'none',
    },
    list: { marginTop: 14, display: 'grid', gap: 12 },
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
    link: { color: '#2563eb', fontWeight: 900, textDecoration: 'none' as const },
    small: { color: '#64748b', fontSize: 13, marginTop: 6 },
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Mes projets</h1>
          <p style={{ color: '#334155' }}>
            Tu dois être connecté pour voir tes projets. <Link href="/account" style={styles.link}>Aller au profil</Link>
          </p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Mes projets</h1>
          <div style={{ marginTop: 10, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Mes projets</h1>
          <Link href="/projects/new" style={styles.blueBtn}>Nouveau projet</Link>
        </div>

        <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
          Connecté en tant que <b>{email}</b>
        </div>

        <div style={styles.list}>
          {items.length === 0 ? (
            <div style={{ padding: 14, border: '1px dashed #cbd5e1', borderRadius: 14, background: '#fff' }}>
              Aucun projet pour l’instant. Clique sur <b>Nouveau projet</b>.
            </div>
          ) : (
            items.map((p) => (
              <div key={p.id} style={styles.item}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={styles.badge}>{labelCategory(p.category)}</span>
                    <span style={styles.badge}>{p.status}</span>
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 900, color: '#0b1f3a' }}>{p.title}</div>
                  <div style={styles.small}>
                    {p.city ? `Ville: ${p.city} · ` : null}
                    Offres: {p.offers?.length ?? 0}
                  </div>
                </div>

                <Link href={`/projects/${p.id}`} style={styles.link}>
                  Voir →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
