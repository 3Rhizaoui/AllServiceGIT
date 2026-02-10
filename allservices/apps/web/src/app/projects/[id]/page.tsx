'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  acceptOffer,
  canChat,
  formatEuro,
  getProjectById,
  labelCategory,
  type Project,
} from '@/lib/projects-store';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [token] = useState(() => getToken());
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  // charge user + projet
  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => {
        const e = (u.email || '').toLowerCase();
        setEmail(e);
        const p = getProjectById(id);
        setProject(p);
      })
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token, id]);

  // recharger le projet après acceptation
  useEffect(() => {
    if (!id) return;
    setProject(getProjectById(id));
  }, [id, info]);

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
      h1: { fontSize: 22, fontWeight: 900, margin: '0 0 8px' },
      meta: { color: '#64748b', fontWeight: 800, fontSize: 12 },
      btnBlue: {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #2563eb',
        background: '#2563eb',
        color: '#fff',
        fontWeight: 900,
        textDecoration: 'none' as const,
        cursor: 'pointer' as const,
      },
      btnGhost: {
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#fff',
        fontWeight: 900,
        textDecoration: 'none' as const,
        cursor: 'pointer' as const,
      },
      box: { padding: 14, border: '1px solid #e5e7eb', borderRadius: 14, marginTop: 12 },
      info: { marginTop: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f8fafc' },
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
    }),
    [],
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.h1}>Détail projet</div>
          <p style={{ color: '#334155' }}>
            Tu dois être connecté.
            {' '}
            <Link href="/account" style={{ color: '#2563eb', fontWeight: 900, textDecoration: 'none' }}>Aller au profil</Link>
          </p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.h1}>Détail projet</div>
          <div style={{ marginTop: 10, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div style={{ padding: 24 }}>Projet introuvable.</div>;
  if (email && project.ownerEmail.toLowerCase() !== email.toLowerCase()) return <div style={{ padding: 24 }}>Accès refusé (V1).</div>;

  const chatEnabled = email ? canChat(project, email) : false;

  function onAccept(offerId: string) {
    try {
      acceptOffer({ projectId: project.id, offerId, ownerEmail: email });
      setInfo('Offre acceptée. Chat activé.');
    } catch (e: any) {
      setInfo(String(e?.message || e));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={styles.h1}>{project.title}</div>
            <div style={styles.meta}>
              <span style={styles.badge}>{labelCategory(project.category)}</span>{' '}
              <span style={styles.badge}>{project.status}</span>{' '}
              • {new Date(project.createdAt).toLocaleString()}
            </div>
          </div>
          <Link href="/projects" style={styles.btnGhost}>← Mes projets</Link>
        </div>

        {info ? <div style={styles.info}><b>Info :</b> {info}</div> : null}

        <div style={styles.box}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Description</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{project.description}</div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href={chatEnabled ? `/projects/${project.id}/chat` : '#'}
            style={{ ...styles.btnBlue, opacity: chatEnabled ? 1 : 0.5, pointerEvents: chatEnabled ? 'auto' : 'none' }}
          >
            Ouvrir le chat
          </Link>
          {!chatEnabled ? (
            <div style={{ color: '#64748b', fontWeight: 800 }}>Chat activé après acceptation d’une offre.</div>
          ) : null}
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900 }}>Offres reçues</div>
          {project.offers.length === 0 ? (
            <div style={{ marginTop: 10, color: '#334155' }}>Aucune offre pour le moment.</div>
          ) : (
            project.offers.map((o) => (
              <div key={o.id} style={styles.box}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{formatEuro(o.priceEur)} • {o.durationDays} jour(s)</div>
                    <div style={styles.meta}>par {o.proEmail} • {new Date(o.createdAt).toLocaleString()}</div>
                  </div>

                  {project.status === 'open' ? (
                    <button style={styles.btnBlue} onClick={() => onAccept(o.id)}>
                      Accepter
                    </button>
                  ) : null}
                </div>
                {o.message ? <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{o.message}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
