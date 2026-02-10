'use client';

import { emailExists, login, me, register, upgradeRoles, type ApiUser } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Step = 'methods' | 'login' | 'register';
type AccountTab = 'customer' | 'pro';

function extractErrorMessage(e: any) {
  const msg = e?.message ?? e ?? '';
  const s = typeof msg === 'string' ? msg : JSON.stringify(msg);
  try {
    const parsed = JSON.parse(s);
    if (parsed?.message) return Array.isArray(parsed.message) ? parsed.message.join(', ') : String(parsed.message);
    return s;
  } catch {
    return s;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

// Départements (IDF) — tu voulais un choix "code postal IDF"
const IDF_DEPTS = [
  { value: '75', label: '75 - Paris' },
  { value: '77', label: '77 - Seine-et-Marne' },
  { value: '78', label: '78 - Yvelines' },
  { value: '91', label: '91 - Essonne' },
  { value: '92', label: '92 - Hauts-de-Seine' },
  { value: '93', label: '93 - Seine-Saint-Denis' },
  { value: '94', label: '94 - Val-de-Marne' },
  { value: '95', label: "95 - Val-d'Oise" },
];

// --------- UI helpers (icônes + widgets type Airbnb) ----------
function Icon({
  name,
  size = 22,
}: {
  name:
    | 'settings'
    | 'help'
    | 'profile'
    | 'privacy'
    | 'gift'
    | 'legal'
    | 'bell'
    | 'chevron'
    | 'switch'
    | 'users'
    | 'briefcase'
    | 'list'
    | 'star';
  size?: number;
}) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' as const };
  switch (name) {
    case 'settings':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.5-2.4.9a7.8 7.8 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7.8 7.8 0 0 0-1.7 1L4.6 8l-2 3.5 2 1.5a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.5 2.4-.9c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.4.9 2-3.5-2-1.5Z" />
        </svg>
      );
    case 'help':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 18h.01" />
          <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
          <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21a8 8 0 0 0-16 0" />
          <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        </svg>
      );
    case 'privacy':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12v10H4V12" />
          <path d="M2 7h20v5H2V7Z" />
          <path d="M12 22V7" />
          <path d="M12 7h4a2 2 0 0 0 0-4c-2.5 0-4 4-4 4Z" />
          <path d="M12 7H8a2 2 0 0 1 0-4c2.5 0 4 4 4 4Z" />
        </svg>
      );
    case 'legal':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h9l3 3v17H6V2Z" />
          <path d="M9 9h6" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case 'switch':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10l-2-2" />
          <path d="M17 17H7l2 2" />
          <path d="M7 7l2-2" />
          <path d="M17 17l-2 2" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21a6 6 0 0 0-12 0" />
          <path d="M11 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" />
          <path d="M19 21a5 5 0 0 0-4-4" />
          <path d="M16 11a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11Z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
          <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M3 12h18" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 7 7 .6-5.3 4.5 1.6 7L12 18l-6.3 3.1 1.6-7L2 9.6 9 9l3-7Z" />
        </svg>
      );
    default:
      return null;
  }
}

function initialsFromEmail(email: string) {
  const base = (email || '').split('@')[0] || 'U';
  const parts = base.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(' ').filter(Boolean);
  const a = parts[0]?.[0] ?? 'U';
  const b = parts[1]?.[0] ?? (parts[0]?.[1] ?? '');
  return (a + b).toUpperCase();
}

function MenuRow({
  title,
  href,
  icon,
  onClick,
}: {
  title: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const Comp: any = href ? 'a' : 'button';
  const props: any = href
    ? { href }
    : { type: 'button', onClick };

  return (
    <Comp
      {...props}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '14px 12px',
        borderRadius: 14,
        border: '1px solid transparent',
        background: '#fff',
        cursor: 'pointer',
        textDecoration: 'none',
        color: '#0b1f3a',
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.background = '#f8fafc';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.background = '#fff';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: '#0b1f3a' }}>
          {icon}
        </div>
        <div style={{ fontWeight: 900 }}>{title}</div>
      </div>
      <div style={{ color: '#64748b' }}>
        <Icon name="chevron" />
      </div>
    </Comp>
  );
}

function TileCard({
  title,
  subtitle,
  href,
  // Mets un fichier dans /public/images/... puis mets imageSrc="/images/xxx.jpg"
  imageSrc,
  fallbackIcon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  imageSrc?: string;
  fallbackIcon: React.ReactNode;
}) {
  const Comp: any = href ? 'a' : 'div';
  const props: any = href
    ? { href, style: { textDecoration: 'none' } }
    : {};
  return (
    <Comp {...props}>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 22,
          background: '#fff',
          overflow: 'hidden',
          padding: 16,
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          boxShadow: '0 8px 30px rgba(15,23,42,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#2563eb', letterSpacing: 0.3 }}>
            {subtitle ? 'NOUVEAU' : ''}
          </div>
          {/* placeholder */}
          <div />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              display: 'grid',
              placeItems: 'center',
              background: '#f8fafc',
              flex: '0 0 auto',
            }}
          >
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ color: '#0b1f3a' }}>{fallbackIcon}</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0b1f3a', lineHeight: 1.15 }}>{title}</div>
            {subtitle ? <div style={{ color: '#64748b', fontWeight: 800 }}>{subtitle}</div> : null}
          </div>
        </div>
      </div>
    </Comp>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // tab affiché via URL quand on est connecté
  const urlTab: AccountTab = (sp.get('tab') as AccountTab) || 'customer';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('methods');
  const [isLoading, setIsLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [tokenState, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);

  // Vue profil courant (Utilisateur / Pro)
  const [viewTab, setViewTab] = useState<AccountTab>('customer');

  // forms
  const [email, setEmailState] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
  const [idfDept, setIdfDept] = useState('75');

  const hasCustomer = !!user?.roles?.includes('customer');
  const hasPro = !!user?.roles?.includes('pro');

  const role1 = hasCustomer ? 'customer' : '';
  const role2 = hasPro ? 'pro' : '';

  const connectedAs = useMemo(() => {
    if (!user) return null;
    return viewTab === 'pro' ? 'Professionnel' : 'Utilisateur';
  }, [user, viewTab]);

  async function reloadMe(currentToken: string) {
    const u = await me(currentToken);
    setUser(u);
  }

  // Init auth
  useEffect(() => {
    const t = getToken();
    setTokenState(t);

    if (t) {
      reloadMe(t)
        .then(() => {
          setViewTab(urlTab);
        })
        .catch(() => {
          clearToken();
          setTokenState(null);
          setUser(null);
          setViewTab('customer');
          setIsModalOpen(true);
        });
    } else {
      // PAS CONNECTÉ => popup DIRECT
      setIsModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si connecté et on change l’url tab
  useEffect(() => {
    if (!tokenState || !user) return;
    if (urlTab === 'pro' && !hasPro) {
      router.replace('/account?tab=customer');
      setViewTab('customer');
      return;
    }
    setViewTab(urlTab);
  }, [urlTab, tokenState, user, hasPro, router]);

  function openAuthModal() {
    setInfoMsg(null);
    setStep('methods');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setInfoMsg(null);
    setIsLoading(false);
    setStep('methods');
  }

  function notReady() {
    setInfoMsg("Cette fonctionnalité n'est pas encore prête.");
  }

  async function onEmailContinue() {
    setInfoMsg(null);

    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) {
      setInfoMsg('Email invalide (ex: nom@domaine.com).');
      return;
    }

    setIsLoading(true);
    try {
      const r = await emailExists(clean);
      setStep(r.exists ? 'login' : 'register');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogin() {
    setInfoMsg(null);

    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) return setInfoMsg('Email invalide.');
    if (password.length < 1) return setInfoMsg('Mot de passe requis.');

    setIsLoading(true);
    try {
      const r = await login(clean, password);
      setToken(r.access_token);
      setTokenState(r.access_token);
      await reloadMe(r.access_token);

      closeModal();
      setViewTab('customer');
      router.replace('/account?tab=customer');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister() {
    setInfoMsg(null);

    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) return setInfoMsg('Email invalide.');
    if (password.length < 8) return setInfoMsg('Mot de passe trop court (min 8).');
    if (password2 !== password) return setInfoMsg('La confirmation du mot de passe ne correspond pas.');
    if (!firstName.trim() || !lastName.trim()) return setInfoMsg('Prénom et nom requis.');
    if (!birthDate.trim()) return setInfoMsg('Date de naissance requise.');

    setIsLoading(true);
    try {
      // ⚠️ IMPORTANT: on n’envoie PAS postal_code au backend
      const r = await register({
        email: clean,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: birthDate.trim(),
        roles: ['customer'],
      } as any);

      setToken(r.access_token);
      setTokenState(r.access_token);
      await reloadMe(r.access_token);

      closeModal();
      setViewTab('customer');
      router.replace('/account?tab=customer');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogout() {
    clearToken();
    setTokenState(null);
    setUser(null);
    setViewTab('customer');
    router.replace('/account');
    setTimeout(() => setIsModalOpen(true), 0);
  }

  async function onBecomePro() {
    if (!tokenState) return;
    setInfoMsg(null);
    setIsLoading(true);
    try {
      const ok = window.confirm('Devenir Professionnel ?\n\nTu pourras proposer des prestations.');
      if (!ok) return;

      const r = await upgradeRoles(tokenState, 'pro');
      if (r?.access_token) {
        setToken(r.access_token);
        setTokenState(r.access_token);
        await reloadMe(r.access_token);
      } else {
        await reloadMe(tokenState);
      }

      setViewTab('pro');
      router.replace('/account?tab=pro');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  function switchProfile() {
    if (viewTab === 'customer') {
      if (!hasPro) {
        void onBecomePro();
        return;
      }
      setViewTab('pro');
      router.replace('/account?tab=pro');
      return;
    }
    setViewTab('customer');
    router.replace('/account?tab=customer');
  }

  // ====== STYLES ======
  const styles = {
    topbar: {
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      borderBottom: '1px solid #e5e7eb',
      background: '#fff',
    },
    brand: { fontWeight: 900, color: '#2563eb', letterSpacing: 0.2 },
    topLink: { color: '#2563eb', fontWeight: 800, textDecoration: 'none' as const },

    page: { padding: 24 as const, background: '#f8fafc', minHeight: 'calc(100vh - 64px)' },
    card: {
      maxWidth: 960,
      margin: '0 auto',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: 18,
    },

    btn: {
      padding: '8px 12px',
      borderRadius: 10,
      border: '1px solid #e5e7eb',
      background: '#fff',
      cursor: 'pointer',
      fontWeight: 800,
    },
    btnBlue: {
      padding: '8px 12px',
      borderRadius: 10,
      border: '1px solid #2563eb',
      background: '#fff',
      cursor: 'pointer',
      fontWeight: 900,
      color: '#2563eb',
    },

    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      zIndex: 9999,
    },
    modal: {
      width: 'min(980px, 96vw)',
      background: '#fff',
      borderRadius: 18,
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      overflow: 'hidden',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    modalHeader: {
      padding: '16px 18px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      background: '#fff',
    },
    modalTitle: { fontWeight: 900, fontSize: 16 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: '1px solid #e5e7eb',
      background: '#fff',
      cursor: 'pointer',
      fontWeight: 900,
    },
    modalBody: {
      padding: 22,
      overflowY: 'auto' as const,
    },
    h1: { fontSize: 44, fontWeight: 900, margin: '0 0 14px', color: '#0b1f3a' },
    label: { fontWeight: 800, fontSize: 13, color: '#334155' },
    input: {
      width: '100%',
      padding: 14,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      marginTop: 8,
      fontSize: 14,
      outline: 'none',
    },
    blueBtn: {
      width: '100%',
      marginTop: 14,
      padding: 14,
      borderRadius: 12,
      border: '1px solid #2563eb',
      background: '#2563eb',
      color: 'white',
      fontWeight: 900,
      cursor: 'pointer',
      fontSize: 14,
    },
    ghostBtn: {
      width: '100%',
      marginTop: 10,
      padding: 14,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      background: '#fff',
      color: '#111',
      fontWeight: 900,
      cursor: 'pointer',
      fontSize: 14,
    },
    sepRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '18px 0',
      color: '#64748b',
      fontWeight: 900,
      fontSize: 12,
    },
    sepLine: { height: 1, background: '#e5e7eb', flex: 1 },
    providerBtn: {
      width: '100%',
      padding: 14,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      background: '#fff',
      fontWeight: 900,
      cursor: 'pointer',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    sectionTitle: { marginTop: 18, marginBottom: 10, fontSize: 24, fontWeight: 900, color: '#0b1f3a' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    infoBox: {
      marginBottom: 12,
      padding: 10,
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      background: '#f8fafc',
    },

    // Profile (Airbnb-like)
    profileTitle: { fontSize: 40, fontWeight: 950 as any, margin: '6px 0 16px', color: '#0b1f3a' },
    profileCard: {
      border: '1px solid #e5e7eb',
      borderRadius: 26,
      padding: 16,
      background: '#fff',
      boxShadow: '0 10px 40px rgba(15,23,42,0.06)',
    },
    avatarWrap: {
      width: 84,
      height: 84,
      borderRadius: 999,
      border: '1px solid #e5e7eb',
      background: '#f1f5f9',
      display: 'grid',
      placeItems: 'center',
      fontWeight: 950 as any,
      fontSize: 26,
      color: '#0b1f3a',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    badge: {
      position: 'absolute' as const,
      right: -2,
      bottom: -2,
      width: 34,
      height: 34,
      borderRadius: 999,
      background: '#ec4899',
      border: '3px solid #fff',
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontWeight: 950 as any,
      fontSize: 14,
    },
    statsCol: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
      minWidth: 180,
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 10,
    },
    statNum: { fontWeight: 950 as any, fontSize: 20, color: '#0b1f3a' },
    statLabel: { fontWeight: 800, color: '#64748b' },
    divider: { height: 1, background: '#e5e7eb', margin: '12px 0' },
  };

  // =========================
  // TOP BAR (TOUJOURS)
  // =========================
  const TopBar = (
    <div style={{...styles.topbar, background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)'}}>

      {!tokenState ? (
        <button
          type="button"
          onClick={openAuthModal}
          style={{ ...styles.btnBlue, border: 'none', background: 'transparent' }}
        >
         
        </button>
      ) : (
        <div />
      )}
    </div>
  );

  // =========================
  // CONNECTED VIEW
  // =========================
  const ConnectedView = tokenState && user ? (
    <div style={{...styles.page,background: 'linear-gradient(135deg, #e0ecff 0%, #ffffff 60%)'}}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: '8px 0' }}>
          Mon Profil {connectedAs ? `: connecté comme ${connectedAs}` : ''}
        </h1>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={switchProfile}
            style={styles.btnBlue}
            disabled={isLoading}
            title={viewTab === 'customer' ? (hasPro ? 'Voir Profil Professionnel' : 'Devenir Professionnel') : 'Voir Profil Utilisateur'}
          >
            {viewTab === 'customer'
              ? hasPro
                ? 'Profil Professionnel'
                : 'Devenir Professionnel'
              : 'Profil Utilisateur'}
          </button>

          <button type="button" onClick={onLogout} style={styles.btn}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div><b>Email :</b> {user.email}</div>
        <div><b>Role :</b> {user.role}</div>
        <div><b>Roles 1 :</b> {role1}</div>
        <div><b>Roles 2 :</b> {role2}</div>
        <div><b>Email vérifié :</b> {user.is_email_verified ? 'Oui' : 'Non'}</div>

        {!hasPro ? (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={() => void onBecomePro()}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 900,
              }}
            >
              Devenir Professionnel
            </button>
          </div>
        ) : null}

        <div style={{ marginTop: 18 }}>
          {viewTab === 'customer' ? (
            <>
              

              {/* Carte profil type Airbnb */}
              <div style={styles.profileCard}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={styles.avatarWrap}>
                      {initialsFromEmail(user.email)}
                      <div style={styles.badge}>✓</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 950 as any, color: '#0b1f3a', lineHeight: 1.1 }}>
                        {user.first_name || 'Utilisateur'}
                      </div>
                      <div style={{ color: '#64748b', fontWeight: 800 }}>
                        Île-de-France, France
                      </div>
                    </div>
                  </div>

                  <div style={styles.statsCol}>
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>0</div>
                      <div style={styles.statLabel}>réservations</div>
                    </div>
                    <div style={styles.divider} />
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>0</div>
                      <div style={styles.statLabel}>avis</div>
                    </div>
                    <div style={styles.divider} />
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>1</div>
                      <div style={styles.statLabel}>année sur AllServices</div>
                    </div>
                  </div>
                </div>
              </div>

                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <TileCard
                    title="Mes projets"
                    subtitle="Voir mes demandes"
                    href="/projects"
                    fallbackIcon={<Icon name="list" size={28} />}
                />

                  <TileCard
                    title="Chercher un pro"
                    subtitle="Créer un nouveau projet"
                    href="/projects/new"
                    fallbackIcon={<Icon name="briefcase" size={28} />}
                />
                </div>




              {/* Menu type Airbnb (Utilisateur) */}
              <div style={{ marginTop: 16 }}>
                <MenuRow title="Paramètres du compte" href="/account/settings" icon={<Icon name="settings" />} />
                <MenuRow title="Obtenir de l'aide" href="/help" icon={<Icon name="help" />} />
                <MenuRow title="Voir le profil" href="/account/profile" icon={<Icon name="profile" />} />
                <MenuRow title="Confidentialité" href="/privacy" icon={<Icon name="privacy" />} />

                <div style={{ height: 10 }} />
                <div style={styles.divider} />
                <div style={{ height: 10 }} />

                <MenuRow title="Cartes cadeaux" href="/gift-cards" icon={<Icon name="gift" />} />
                <MenuRow title="Juridique" href="/legal" icon={<Icon name="legal" />} />
              </div>
            </>
          ) : (
            <>
             

              {/* Carte profil PRO */}
              <div style={styles.profileCard}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={styles.avatarWrap}>
                      {initialsFromEmail(user.email)}
                      <div style={{ ...styles.badge, background: '#2563eb' }}>
                        <Icon name="briefcase" size={16} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 950 as any, color: '#0b1f3a', lineHeight: 1.1 }}>
                        {user.first_name || 'Professionnel'}
                      </div>
                      <div style={{ color: '#64748b', fontWeight: 800 }}>
                        Prestataire en Île-de-France
                      </div>
                    </div>
                  </div>

                  <div style={styles.statsCol}>
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>0</div>
                      <div style={styles.statLabel}>prestations</div>
                    </div>
                    <div style={styles.divider} />
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>0</div>
                      <div style={styles.statLabel}>évaluations</div>
                    </div>
                    <div style={styles.divider} />
                    <div style={styles.statRow}>
                      <div style={styles.statNum}>0</div>
                      <div style={styles.statLabel}>clients</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== POINT 4 : liens + images (cartes) façon capture Airbnb ===== */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Si tu veux des VRAIES images :
                    1) mets tes images dans /public/images/
                    2) remplace imageSrc par "/images/ton-image.jpg"
                 */}
                <TileCard
                  title="Appels d’offres"
                  subtitle="Voir les projets ouverts"
                  href="/pro/projects"
                  fallbackIcon={<Icon name="list" size={28} />}
                />

                <TileCard
                  title="Mes offres"
                  subtitle="Voir mes propositions"
                  href="/pro/projects"
                  fallbackIcon={<Icon name="users" size={28} />}
                />

              </div>

              <div style={{ marginTop: 16 }}>
                <MenuRow title="Paramètres du compte" href="/account/settings" icon={<Icon name="settings" />} />
                <MenuRow title="Notifications" href="/account/notifications" icon={<Icon name="bell" />} />
                <MenuRow title="Voir mon profil public" href="/pro/profile" icon={<Icon name="profile" />} />
                <MenuRow title="Confidentialité" href="/privacy" icon={<Icon name="privacy" />} />

                <div style={{ height: 10 }} />
                <div style={styles.divider} />
                <div style={{ height: 10 }} />

                <MenuRow title="Avis & évaluations" href="/pro/reviews" icon={<Icon name="star" />} />
                <MenuRow title="Obtenir de l'aide" href="/help" icon={<Icon name="help" />} />
                <MenuRow title="Juridique" href="/legal" icon={<Icon name="legal" />} />
              </div>
            </>
          )}
        </div>

        {infoMsg ? (
          <div style={{ marginTop: 14, ...styles.infoBox }}>
            <b>Info :</b> {infoMsg}
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  // =========================
  // AUTH MODAL (NOT CONNECTED)
  // =========================
  const AuthModal = isModalOpen ? (
    <div style={styles.overlay} onMouseDown={closeModal}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Connexion ou inscription</div>
          <button style={styles.closeBtn} onClick={closeModal} aria-label="Fermer">✕</button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.h1}>Bienvenue sur AllServices</div>

          {infoMsg ? (
            <div style={styles.infoBox}>
              <b>Info :</b> {infoMsg}
            </div>
          ) : null}

          {/* STEP 1 : METHODS */}
          {step === 'methods' ? (
            <>
              <div style={styles.label}>Adresse e-mail</div>
              <input
                value={email}
                onChange={(e) => setEmailState(e.currentTarget.value)}
                placeholder="ex: moi@email.com"
                style={styles.input}
                autoComplete="email"
                inputMode="email"
              />

              <button
                onClick={onEmailContinue}
                disabled={isLoading}
                style={{ ...styles.blueBtn, opacity: isLoading ? 0.7 : 1 }}
              >
                Continuer
              </button>

              <div style={styles.sepRow}>
                <div style={styles.sepLine} />
                <div>ou</div>
                <div style={styles.sepLine} />
              </div>

              <button type="button" style={styles.providerBtn} onClick={notReady}>
                <span style={{ fontWeight: 900 }}>G</span> Continuer avec Google
              </button>
              <button type="button" style={styles.providerBtn} onClick={notReady}>
                <span style={{ fontWeight: 900 }}></span> Continuer avec Apple
              </button>
              <button type="button" style={styles.providerBtn} onClick={notReady}>
                <span style={{ fontWeight: 900 }}>☎</span> Continuer avec le numéro de téléphone
              </button>
              <button type="button" style={styles.providerBtn} onClick={notReady}>
                <span style={{ fontWeight: 900 }}>f</span> Continuer avec Facebook
              </button>
            </>
          ) : null}

          {/* STEP 2 : LOGIN */}
          {step === 'login' ? (
            <>
              <div style={styles.label}>Adresse e-mail</div>
              <input
                value={email}
                onChange={(e) => setEmailState(e.currentTarget.value)}
                style={styles.input}
                autoComplete="email"
              />

              <div style={{ height: 10 }} />

              <div style={styles.label}>Mot de passe</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                type="password"
                style={styles.input}
                autoComplete="current-password"
              />

              <button
                onClick={onLogin}
                disabled={isLoading}
                style={{ ...styles.blueBtn, opacity: isLoading ? 0.7 : 1 }}
              >
                Se connecter
              </button>

              <button
                onClick={() => {
                  setInfoMsg(null);
                  setPassword('');
                  setStep('methods');
                }}
                style={styles.ghostBtn}
              >
                Retour
              </button>
            </>
          ) : null}

          {/* STEP 2 : REGISTER */}
          {step === 'register' ? (
            <>
              <div style={styles.sectionTitle}>Créer mon compte</div>

              <div style={styles.grid2}>
                <div>
                  <div style={styles.label}>Prénom</div>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    style={styles.input}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <div style={styles.label}>Nom</div>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    style={styles.input}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div style={styles.label}>Date de naissance</div>
              <input
                value={birthDate}
                onChange={(e) => setBirthDate(e.currentTarget.value)}
                type="date"
                style={styles.input}
              />

              <div style={{ height: 12 }} />

              <div style={styles.label}>Code postal (Île-de-France)</div>
              <select
                value={idfDept}
                onChange={(e) => setIdfDept(e.currentTarget.value)}
                style={{ ...styles.input, background: '#fff' }}
              >
                {IDF_DEPTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              {/* NB : on ne l’envoie pas au backend */}

              <div style={{ height: 12 }} />

              <div style={styles.label}>Adresse e-mail</div>
              <input
                value={email}
                onChange={(e) => setEmailState(e.currentTarget.value)}
                style={styles.input}
                autoComplete="email"
              />

              <div style={{ height: 12 }} />

              <div style={styles.label}>Mot de passe</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                type="password"
                style={styles.input}
                autoComplete="new-password"
              />

              <div style={{ height: 12 }} />

              <div style={styles.label}>Confirmer le mot de passe</div>
              <input
                value={password2}
                onChange={(e) => setPassword2(e.currentTarget.value)}
                type="password"
                style={styles.input}
                autoComplete="new-password"
              />

              <button
                onClick={onRegister}
                disabled={isLoading}
                style={{ ...styles.blueBtn, opacity: isLoading ? 0.7 : 1 }}
              >
                Créer mon compte
              </button>

              <button
                onClick={() => {
                  setInfoMsg(null);
                  setPassword('');
                  setPassword2('');
                  setStep('methods');
                }}
                style={styles.ghostBtn}
              >
                Retour
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  ) : null;

  // =========================
  // RENDER
  // =========================
  return (
    <div>
      {TopBar}
      {ConnectedView}

      {/* Si pas connecté, page vide */}
      {!tokenState ? <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #e0ecff 0%, #ffffff 60%)' }} /> : null}

      {AuthModal}
    </div>
  );
}
