'use client';

import { useEffect } from 'react';

export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // ignore
      }
    };

    register();
  }, []);

  return null;
}
