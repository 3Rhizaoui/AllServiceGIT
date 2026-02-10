'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  labelCategory,
  listAssignedProjectsForPro,
  listOpenProjects,
  type Project,
  type ProjectCategory,
} from '@/lib/projects-store';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const CATS: { value: '' | ProjectCategory; label: string }[] = [
  { value: '', label: 'Toutes catégories' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'maconnerie', label: 'Maçonnerie' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'autre', label: 'Autre' },
];

export default function ProProjectsPage() {
  const [token] = useState(() => getToken());
  const [email, setEmail] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [cat, setCat] = useState<'' | ProjectCategory>('');
  const [openItems, setOpenItems] = useState<Project[]>([]);
  const [assignedItems, setAssignedItems] = useState<Project[]>([]);

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => {
        const e = (u.email || '').toLowerCase();
        setEmail(e);

        setOpenItems(listOpenProjects(cat ? { category: cat } : undefined));
        setAssignedItems(listAssignedProjectsForPro(e));
      })
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token, cat]);

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
      titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap' as const,
      },
      h1: { margin: 0, fontSize: 22, fontWeight: 900, color: '#0b1f3a' },
      select: { padding: 10, borderRadius: 12, border: '1px solid #e5e7eb', fontWeight: 800 },
      section: { marginTop: 18, fontWeight: 900, color: '#0b1f3a' },
      list: { marginTop: 10, display: 'grid', gap: 12 },
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
      empty: { padding: 14, border: '1px dashed #cbd5e1', borderRadius: 14, background: '#fff' },
    }),
    [],
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Appels d’offres</h1>
          <p style={{ color: '#334155' }}>
            Tu dois être connecté pour voir les appels d’offres.
            {' '}
            <Link href="/account" style={styles.link}>
              Aller au profil
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Appels d’offres</h1>
          <div
            style={{
              marginTop: 10,
              padding: 12,
              border: '1px solid #fecaca',
              background: '#fff1f2',
              borderRadius: 12,
            }}
          >
            <b>Erreur:</b> {err}
          </div>
        </div>
      </div>
    );
  }

  function ProjectRow(p: Project, rightLinkHref: string, rightLabel: string) {
    return (
      <div key={p.id} style={styles.item}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={styles.badge}>{labelCategory(p.category)}</span>
            <span style={styles.badge}>{p.status}</span>
          </div>
          <div style={{ marginTop: 8, fontWeight: 900, color: '#0b1f3a' }}>{p.title}</div>
          <div style={styles.small}>
            {p.city ? `Ville: ${p.city} · ` : null}
            Offres: {p.offers?.length ?? 0} · Publié: {new Date(p.createdAt).toLocaleString()}
          </div>
        </div>

        <Link href={rightLinkHref} style={styles.link}>
          {rightLabel} →
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Espace Pro — Appels d’offres</h1>
          <select value={cat} onChange={(e) => setCat(e.currentTarget.value as any)} style={styles.select}>
            {CATS.map((c) => (
              <option key={c.label} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
          Connecté en tant que <b>{email}</b>
        </div>

        <div style={styles.section}>Mes projets assignés (avec chat)</div>
        <div style={styles.list}>
          {assignedItems.length === 0 ? (
            <div style={styles.empty}>Aucun projet assigné pour l’instant.</div>
          ) : (
            assignedItems.map((p) => ProjectRow(p, `/pro/projects/${p.id}`, 'Ouvrir'))
          )}
        </div>

        <div style={styles.section}>Appels d’offres ouverts</div>
        <div style={styles.list}>
          {openItems.length === 0 ? (
            <div style={styles.empty}>Aucun appel d’offre ouvert pour l’instant.</div>
          ) : (
            openItems.map((p) => ProjectRow(p, `/pro/projects/${p.id}`, 'Ouvrir'))
          )}
        </div>
      </div>
    </div>
  );
}
