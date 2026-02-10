'use client';

export type ChatMessage = {
  id: string;
  projectId: string;
  authorEmail: string;
  text: string;
  createdAt: number;
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function key(projectId: string) {
  return `allservices.chat.v1.${projectId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listMessages(projectId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const msgs = safeParse<ChatMessage[]>(localStorage.getItem(key(projectId)), []);
  return Array.isArray(msgs) ? msgs.sort((a, b) => a.createdAt - b.createdAt) : [];
}

export function sendMessage(input: { projectId: string; authorEmail: string; text: string }): ChatMessage {
  if (typeof window === 'undefined') throw new Error('Client only');
  const text = (input.text ?? '').trim();
  if (!text) throw new Error('Message vide.');

  const msgs = listMessages(input.projectId);
  const msg: ChatMessage = {
    id: uid('msg'),
    projectId: input.projectId,
    authorEmail: input.authorEmail,
    text,
    createdAt: Date.now(),
  };
  msgs.push(msg);
  localStorage.setItem(key(input.projectId), JSON.stringify(msgs));
  return msg;
}
