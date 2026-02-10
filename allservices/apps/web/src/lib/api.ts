const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

// Si ton API a un prefix global "api", mets:
// const API_URL = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  // si l'API renvoie une erreur JSON
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

export type ApiUser = {
  id: string;
  email: string;
  role: 'customer' | 'pro' | 'both' | 'admin';
  roles: Array<'customer' | 'pro'>;
  first_name?: string;
  last_name?: string;
  is_email_verified?: boolean;
};

export function emailExists(email: string) {
  const q = encodeURIComponent(email);
  return apiFetch<{ exists: boolean }>(`/auth/email-exists?email=${q}`, {
    method: 'GET',
  });
}

export function login(email: string, password: string) {
  return apiFetch<{ user: ApiUser; access_token: string }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(dto: any) {
  return apiFetch<{ user: ApiUser; access_token: string }>(`/auth/register`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function me(token: string) {
  return apiFetch<ApiUser>(`/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function upgradeRoles(token: string, add: 'customer' | 'pro') {
  return apiFetch<{ user: ApiUser; access_token: string }>(`/auth/upgrade-roles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ add }),
  });
}

export async function logout(token?: string): Promise<{ ok: boolean }> {
  const t = token ?? '';
  if (!t) return { ok: true };
  try {
    return await apiFetch<{ ok: boolean }>(`/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
    });
  } catch {
    return { ok: true };
  }
}
