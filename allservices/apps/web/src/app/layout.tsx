import Link from 'next/link';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
                style={{background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)', }}
          >

        <header
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)',
          }}
        >
          <Link href="/" style={{ fontWeight: 800, textDecoration: 'none' }}>
            AllServices
          </Link>

          <nav style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <Link href="/account" style={{ color: '#1d4ed8', fontWeight: 700, textDecoration: 'none' }}>
                Se connecter / Devenir Pro
              </Link>

          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
