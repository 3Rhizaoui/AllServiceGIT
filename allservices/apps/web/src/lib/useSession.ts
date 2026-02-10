'use client';

import { useEffect, useState } from 'react';
import { me, type ApiUser } from './api';
import { clearToken, getToken } from './auth';

export function useSession() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload(t: string) {
    const u = await me(t);
    setUser(u);
  }

  useEffect(() => {
    const t = getToken();
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    reload(t)
      .catch(() => {
        clearToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { token, user, loading };
}
