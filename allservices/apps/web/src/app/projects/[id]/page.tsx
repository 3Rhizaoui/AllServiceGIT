'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { acceptOffer, canChat, getProjectById, listOffers } from '@/lib/projects-store';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [token] = useState(() => getToken());
  const [email, setEmail] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => setEmail((u.email || '').toLowerCase()))
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token]);

  const project = useMemo(() => getProjectById(id), [id, info]);
  const offers = useMemo(() => listOffers(id), [id, info]);

  if (!token) {
    router.replace('/account');
    return null;
  }
  if (err) return <div style={{ padding: 24 }}><b>Erreur:</b> {err}</div>;
  if (!project) return <div style={{ padding: 24 }}>Projet introuvable.</div>;
  if (email && project.ownerEmail.toLowerCase() !== email.toLowerCase()) return <div style={{ padding: 24 }}>Accès refusé.</div>;

  function onAccept(offerId: string) {
    try {
      acceptOffer({ projectId: project.id, offerId, ownerEmail: email });
      setInfo('Offre acceptée. Chat activé.');
    } catch (e: any) {
      setInfo(String(e?.message || e));
    }
  }

  const chatEnabled = email ? canChat(project, email) : false;

  const styles = {
    page: { padding: 24, background: '#f8fafc', minHeight: 'calc(100vh - 64px)' },
    card: { maxWidth: 960, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 },
    h1: { fontSize: 22, fontWeight: 900, margin: '0 0 8px' },
    meta: { color: '#64748b', fontWeight: 800, fontSize: 12 },
    btnBlue: { padding: '10px 12px', borderRadius: 12, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: 900, textDecoration: 'none' as const },
    btnGhost: { padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 900, cursor: 'pointer' as const },
    box: { padding: 14, border: '1px solid #e5e7eb', borderRadius: 14, marginTop: 12 },
    info: { marginTop: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f8fafc' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={styles.h1}>{project.title}</div>
            <div style={styles.meta}>
              {project.category} • statut: {project.status} • {new Date(project.createdAt).toLocaleString()}
            </div>
          </div>
          <Link href="/projects" style={styles.btnGhost as any}>← Mes projets</Link>
        </div>

        {info ? <div style={styles.info}><b>Info :</b> {info}</div> : null}

        <div style={styles.box}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Description</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{project.description}</div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href={chatEnabled ? `/projects/${project.id}/chat` : '#'}
            style={{ ...styles.btnBlue, opacity: chatEnabled ? 1 : 0.5, pointerEvents: chatEnabled ? 'auto' : 'none' }}
          >
            Ouvrir le chat
          </Link>
          {!chatEnabled ? <div style={{ color: '#64748b', fontWeight: 800 }}>Chat activé après acceptation d’une offre.</div> : null}
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900 }}>Offres reçues</div>
          {offers.length === 0 ? (
            <div style={{ marginTop: 10, color: '#334155' }}>Aucune offre pour le moment.</div>
          ) : (
            offers.map((o) => (
              <div key={o.id} style={styles.box}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      {o.priceEur} € • {o.durationDays} jour(s)
                    </div>
                    <div style={styles.meta}>
                      par {o.proEmail} • {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {project.status === 'open' ? (
                    <button style={styles.btnBlue as any} onClick={() => onAccept(o.id)}>
                      Accepter
                    </button>
                  ) : null}
                </div>
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{o.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
