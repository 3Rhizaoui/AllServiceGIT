'use client';

import { getToken } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(!!getToken());
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ fontWeight: 700, color: 'blue', fontSize: 18 }}>
        AllServices
      </Link>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {/* ✅ texte modifié */}
        {!isConnected && (
          <Link
            href="/become-pro"
            style={{ textDecoration: 'none', fontWeight: 500 }}
          >
            Créer votre compte et chercher ou proposer une prestation
          </Link>
        )}

        {/* ✅ lien Compte supprimé */}
        {/* Si connecté, on peut afficher autre chose plus tard si besoin */}
      </nav>
    </header>
  );
}
