'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { addOffer, canChat, formatEuro, getProjectById, labelCategory, type Project } from '@/lib/projects-store';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function ProProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [token] = useState(() => getToken());
  const [email, setEmail] = useState<string>('');
  const [isPro, setIsPro] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const project = useMemo(() => getProjectById(id), [id, info]);

  const [price, setPrice] = useState('450');
  const [days, setDays] = useState('2');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => {
        const e = (u.email || '').toLowerCase();
        setEmail(e);
        setIsPro(!!u.roles?.includes('pro'));
      })
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token]);

  const chatEnabled = !!email && canChat(project, email);

  if (!token) {
    return <div style={{ padding: 24 }}>Tu dois être connecté pour accéder à cette page.</div>;
  }
  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <b>Erreur :</b> {err}
      </div>
    );
  }
  if (!isPro) {
    return <div style={{ padding: 24 }}>Accès réservé aux professionnels.</div>;
  }
  if (!project) {
    return <div style={{ padding: 24 }}>Projet introuvable.</div>;
  }

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
    h1: { fontSize: 22, fontWeight: 900, margin: '0 0 8px' },
    meta: { color: '#64748b', fontWeight: 800, fontSize: 12 },
    box: { padding: 14, border: '1px solid #e5e7eb', borderRadius: 14, marginTop: 12 },
    input: {
      width: '100%',
      padding: 14,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      marginTop: 8,
      fontSize: 14,
      outline: 'none',
    },
    label: { fontWeight: 800, fontSize: 13, color: '#334155' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btnBlue: {
      padding: '12px 14px',
      borderRadius: 12,
      border: '1px solid #2563eb',
      background: '#2563eb',
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer' as const,
    },
    btnGhost: {
      padding: '10px 12px',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      background: '#fff',
      fontWeight: 900,
      cursor: 'pointer' as const,
    },
    info: { marginTop: 12, padding: 10, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f8fafc' },
  };

  function submit() {
    setInfo(null);
    const p = Number(price);
    const d = Number(days);
    if (!Number.isFinite(p) || p <= 0) return setInfo('Prix invalide.');
    if (!Number.isFinite(d) || d <= 0) return setInfo('Durée invalide.');
    if (!message.trim()) return setInfo('Message requis.');

    try {
      addOffer({
        projectId: project.id,
        proEmail: email,
        priceEur: p,
        durationDays: d,
        message: message.trim(),
      });
      setInfo('Offre envoyée ✅');
      setMessage('');
    } catch (e: any) {
      setInfo(String(e?.message || e || 'Erreur'));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={styles.h1}>{project.title}</div>
            <div style={styles.meta}>
              {labelCategory(project.category)} • statut: {project.status} • publié: {new Date(project.createdAt).toLocaleString()}
            </div>
          </div>
          <button onClick={() => router.push('/pro/projects')} style={styles.btnGhost}>
            ← Retour
          </button>
        </div>

        {info ? (
          <div style={styles.info}>
            <b>Info :</b> {info}
          </div>
        ) : null}

        <div style={styles.box}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Description</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{project.description}</div>
        </div>

        {project.status !== 'open' ? (
          <div style={styles.info}>
            Ce projet n’accepte plus d’offres.
            {chatEnabled ? (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => router.push(`/projects/${project.id}/chat`)}
                  style={styles.btnBlue}
                >
                  Ouvrir le chat
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 16, fontWeight: 900 }}>Proposer une offre</div>

            <div style={{ ...styles.row, marginTop: 10 }}>
              <div>
                <div style={styles.label}>Prix (€)</div>
                <input value={price} onChange={(e) => setPrice(e.currentTarget.value)} style={styles.input} inputMode="numeric" />
              </div>
              <div>
                <div style={styles.label}>Durée (jours)</div>
                <input value={days} onChange={(e) => setDays(e.currentTarget.value)} style={styles.input} inputMode="numeric" />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={styles.label}>Message</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                style={{ ...styles.input, minHeight: 120 }}
                placeholder="Explique ta proposition..."
              />
            </div>

            <button onClick={submit} style={{ ...styles.btnBlue, marginTop: 12 }}>
              Envoyer mon offre
            </button>
          </>
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 900 }}>Offres déjà reçues (aperçu)</div>
          {project.offers.length === 0 ? (
            <div style={{ marginTop: 8, color: '#334155' }}>Aucune offre.</div>
          ) : (
            project.offers.map((o) => (
              <div key={o.id} style={styles.box}>
                <div style={{ fontWeight: 900 }}>
                  {formatEuro(o.priceEur)} • {o.durationDays} jour(s)
                </div>
                <div style={styles.meta}>par {o.proEmail}</div>
                {o.message ? <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{o.message}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
