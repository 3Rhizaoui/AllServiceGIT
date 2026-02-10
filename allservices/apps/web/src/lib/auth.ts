const TOKEN_KEY = 'allservices_token';
const ACTIVE_PROFILE_KEY = 'allservices_active_profile'; // 'customer' | 'pro'

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}
// ✅ compat avec tes imports existants (Account page importait cleanToken)
export const cleanToken = clearToken;

export type ActiveProfile = 'customer' | 'pro';

export function setActiveProfile(p: ActiveProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, p);
}

export function getActiveProfile(): ActiveProfile | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return v === 'customer' || v === 'pro' ? v : null;
}
