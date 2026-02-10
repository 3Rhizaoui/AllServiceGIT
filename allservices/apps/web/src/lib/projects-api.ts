// apps/web/src/lib/projects-api.ts
import { getToken } from './auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as any),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });

  // essaye de lire json même en erreur
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      (data as any)?.error ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return (data ?? ({} as any)) as T;
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

// ---------- Types ----------
export type ProjectCategory =
  | 'plomberie'
  | 'electricite'
  | 'peinture'
  | 'maconnerie'
  | 'menuiserie'
  | 'renovation'
  | 'autre';

export type ProjectStatus = 'open' | 'assigned' | 'closed';

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  status: ProjectStatus;
  created_at?: string;
  assigned_pro_user_id?: string | null;
};

export type Offer = {
  id: string;
  project_id: string;
  pro_user_id: string;
  price_eur: number;
  duration_days: number;
  message?: string;
  created_at?: string;
};

export type ChatMessage = {
  id: string;
  project_id: string;
  sender_user_id: string;
  content: string;
  created_at?: string;
};

// ---------- API calls (attendues côté backend) ----------

// user
export async function createProject(input: {
  title: string;
  category: ProjectCategory;
  description: string;
}): Promise<{ project: Project }> {
  return apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function myProjects(): Promise<{ projects: Project[] }> {
  return apiFetch('/projects/my', { method: 'GET' });
}

export async function getProject(id: string): Promise<{ project: Project }> {
  return apiFetch(`/projects/${id}`, { method: 'GET' });
}

export async function getProjectOffers(
  projectId: string,
): Promise<{ offers: Offer[] }> {
  return apiFetch(`/projects/${projectId}/offers`, { method: 'GET' });
}

export async function acceptOffer(input: {
  projectId: string;
  offerId: string;
}): Promise<{ ok: boolean; project?: Project }> {
  return apiFetch(`/projects/${input.projectId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ offer_id: input.offerId }),
  });
}

// pro
export async function proOpenProjects(params?: {
  category?: ProjectCategory;
}): Promise<{ projects: Project[] }> {
  const q = params?.category ? `?category=${encodeURIComponent(params.category)}` : '';
  return apiFetch(`/pro/projects${q}`, { method: 'GET' });
}

export async function proSubmitOffer(input: {
  projectId: string;
  price_eur: number;
  duration_days: number;
  message?: string;
}): Promise<{ offer: Offer }> {
  return apiFetch(`/pro/projects/${input.projectId}/offers`, {
    method: 'POST',
    body: JSON.stringify({
      price_eur: input.price_eur,
      duration_days: input.duration_days,
      message: input.message ?? '',
    }),
  });
}

// chat
export async function getChat(projectId: string): Promise<{ messages: ChatMessage[] }> {
  return apiFetch(`/projects/${projectId}/chat`, { method: 'GET' });
}

export async function sendChat(projectId: string, content: string): Promise<{ message: ChatMessage }> {
  return apiFetch(`/projects/${projectId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
