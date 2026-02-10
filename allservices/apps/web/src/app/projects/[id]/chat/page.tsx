'use client';

import { canChat, getProject } from '@/lib/mockProjects';
import { useSession } from '@/lib/useSession';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type ChatMsg = { id: string; userId: string; text: string; at: string };

function keyFor(projectId: string) {
  return `allservices_chat_v1_${projectId}`;
}

function load(projectId: string): ChatMsg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyFor(projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ChatMsg[];
  } catch {
    return [];
  }
}

function save(projectId: string, msgs: ChatMsg[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(projectId), JSON.stringify(msgs));
}

export default function ProjectChatPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { token, user, loading } = useSession();

  const project = useMemo(() => getProject(id), [id]);

  const [msgs, setMsgs] = useState<ChatMsg[]>(() => load(id));
  const [text, setText] = useState('');

  if (!loading && (!token || !user)) {
    router.replace('/account');
    return null;
  }
  if (!project) return <div style={{ padding: 24 }}>Projet introuvable.</div>;
  if (user && !canChat(project, user.id)) return <div style={{ padding: 24 }}>Chat non disponible (V1).</div>;

  function send() {
    if (!user) return;
    if (!text.trim()) return;
    const next: ChatMsg = { id: `${Date.now()}_${Math.random()}`, userId: user.id, text: text.trim(), at: new Date().toISOString() };
    const all = [...msgs, next];
    setMsgs(all);
    save(id, all);
    setText('');
  }

  const styles = {
    page: { padding: 24, background: '#f8fafc', minHeight: '100vh' },
    card: { maxWidth: 960, margin: '0 auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 },
    h1: { fontSize: 20, fontWeight: 900, margin: 0 },
    msg: { padding: 12, border: '1px solid #e5e7eb', borderRadius: 14, marginTop: 10, background: '#fff' },
    meta: { color: '#64748b', fontWeight: 800, fontSize: 12, marginTop: 4 },
    input: { width: '100%', padding: 14, borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, outline: 'none' },
    btnBlue: { padding: '12px 14px', borderRadius: 12, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer' as const },
    btnGhost: { padding: '10px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 900, cursor: 'pointer' as const },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={styles.h1}>Chat — {project.title}</div>
            <div style={styles.meta}>Activé car une offre a été acceptée.</div>
          </div>
          <button onClick={() => router.push(`/projects/${id}`)} style={styles.btnGhost}>← Retour</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {msgs.length === 0 ? <div style={{ color: '#334155' }}>Aucun message.</div> : null}
          {msgs.map((m) => (
            <div key={m.id} style={styles.msg}>
              <div style={{ fontWeight: 900 }}>{m.userId === user?.id ? 'Moi' : 'Interlocuteur'}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              <div style={styles.meta}>{new Date(m.at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <input value={text} onChange={(e) => setText(e.currentTarget.value)} style={styles.input} placeholder="Écrire un message..." />
          <button onClick={send} style={styles.btnBlue}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}
