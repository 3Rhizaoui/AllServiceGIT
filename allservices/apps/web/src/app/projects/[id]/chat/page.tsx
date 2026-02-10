'use client';

import { me } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { listMessages, sendMessage, type ChatMessage } from '@/lib/chat-store';
import { canChat, getProjectById } from '@/lib/projects-store';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ProjectChatPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();

  const [token] = useState(() => getToken());
  const [email, setEmail] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const project = useMemo(() => getProjectById(projectId), [projectId]);

  useEffect(() => {
    if (!token) return;
    me(token)
      .then((u) => {
        const e = (u.email || '').toLowerCase();
        setEmail(e);
      })
      .catch((e) => setErr(String(e?.message || e || 'Erreur')));
  }, [token]);

  useEffect(() => {
    if (!email) return;
    const p = getProjectById(projectId);
    if (!p) return;
    if (!canChat(p, email)) {
      setErr('Chat non disponible : il est activé uniquement après acceptation d’une offre.');
      return;
    }
    setItems(listMessages(projectId));
  }, [email, projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items.length]);

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
      h1: { margin: 0, fontSize: 22, fontWeight: 900, color: '#0b1f3a' },
      meta: { color: '#64748b', fontWeight: 800, fontSize: 12 },
      link: { color: '#2563eb', fontWeight: 900, textDecoration: 'none' as const },
      chatBox: {
        marginTop: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: '#f8fafc',
        padding: 12,
        height: 'min(60vh, 520px)',
        overflowY: 'auto' as const,
      },
      msg: {
        padding: 10,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        background: '#fff',
        marginBottom: 10,
      },
      msgMine: {
        border: '1px solid #bfdbfe',
        background: '#eff6ff',
      },
      inputRow: { marginTop: 12, display: 'flex', gap: 10 },
      input: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        outline: 'none',
      },
      btnBlue: {
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #2563eb',
        background: '#2563eb',
        color: '#fff',
        fontWeight: 900,
        cursor: 'pointer' as const,
      },
    }),
    [],
  );

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Chat</h1>
          <p style={{ color: '#334155' }}>
            Tu dois être connecté.
            {' '}
            <Link href="/account" style={styles.link}>
              Aller au profil
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Chat</h1>
          <div style={{ marginTop: 12, color: '#334155' }}>Projet introuvable.</div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Chat</h1>
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #fecaca', background: '#fff1f2', borderRadius: 12 }}>
            <b>Erreur:</b> {err}
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={`/projects/${projectId}`} style={styles.link}>
              ← Retour au projet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function onSend() {
    if (!email) return;
    if (!text.trim()) return;
    sendMessage({ projectId, authorEmail: email, text: text.trim() });
    setText('');
    setItems(listMessages(projectId));
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={styles.h1}>Chat</h1>
            <div style={styles.meta}>{project.title}</div>
          </div>
          <Link href={`/projects/${projectId}`} style={styles.link}>
            ← Retour au projet
          </Link>
        </div>

        <div style={styles.chatBox}>
          {items.length === 0 ? (
            <div style={{ color: '#64748b', fontWeight: 800 }}>Aucun message.</div>
          ) : (
            items.map((m) => {
              const mine = m.authorEmail.toLowerCase() === email.toLowerCase();
              return (
                <div key={m.id} style={{ ...styles.msg, ...(mine ? styles.msgMine : null) }}>
                  <div style={styles.meta}>
                    {mine ? 'Moi' : m.authorEmail} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputRow}>
          <input
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            style={styles.input}
            placeholder="Écrire un message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button type="button" onClick={onSend} style={styles.btnBlue}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
