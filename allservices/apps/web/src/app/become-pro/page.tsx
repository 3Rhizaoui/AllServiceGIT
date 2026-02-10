'use client';

import { emailExists, login, register } from '@/lib/api';
import { setToken } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Step = 'email' | 'login' | 'details';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// accepte "23/06/1986" ou "1986-06-23" → renvoie "1986-06-23" ou null
function normalizeBirthDate(input: string): string | null {
  const v = input.trim();
  if (!v) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // DD/MM/YYYY
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  return null;
}

function extractErrorMessage(e: any) {
  const msg = String(e?.message || e || '');
  return msg || 'Une erreur est survenue.';
}

export default function BecomeProPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // détails (inscription)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState(''); // user input (DD/MM/YYYY ou YYYY-MM-DD)

  const cleanEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function onContinueEmail() {
    setInfoMsg(null);

    if (!isValidEmail(cleanEmail)) {
      setInfoMsg('Email invalide (ex: nom@domaine.com).');
      return;
    }

    setIsLoading(true);
    try {
      const r = await emailExists(cleanEmail);
      if (r.exists) {
        // ✅ utilisateur connu → login direct (juste password)
        setStep('login');
      } else {
        // ✅ nouveau → détails
        setStep('details');
      }
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function onContinueLogin() {
    setInfoMsg(null);

    if (password.trim().length < 8) {
      setInfoMsg('Mot de passe trop court (min 8 caractères).');
      return;
    }

    setIsLoading(true);
    try {
      const r = await login(cleanEmail, password);
      setToken(r.access_token);
      router.push('/account');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function onAcceptAndContinueRegister() {
    setInfoMsg(null);

    if (password.trim().length < 8) {
      setInfoMsg('Mot de passe trop court (min 8 caractères).');
      return;
    }

    const normalized = normalizeBirthDate(birthDate);
    if (!normalized) {
      setInfoMsg('Date de naissance invalide. Format attendu: jj/mm/aaaa (ou aaaa-mm-jj).');
      return;
    }

    setIsLoading(true);
    try {
      // ✅ nouveau flux: on crée toujours un compte customer par défaut
      // puis upgrade en pro se fera depuis /account (popup)
      const r = await register({
        email: cleanEmail,
        password,
        roles: ['customer'],
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_date: normalized,
      });

      setToken(r.access_token);
      router.push('/account');
    } catch (e: any) {
      setInfoMsg(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }

  function onBack() {
    setInfoMsg(null);
    if (step === 'login') setStep('email');
    else if (step === 'details') setStep('email');
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-[560px] rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4 text-center font-semibold">Connexion ou inscription</div>

        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold mb-4">Bienvenue sur AllServices</h1>

          {infoMsg ? (
            <div className="mb-4 rounded-lg border px-4 py-3 text-sm">
              <b>Info :</b> {infoMsg}
            </div>
          ) : null}

          {step === 'email' && (
            <>
              <label className="block text-sm font-medium mb-2">Adresse e-mail</label>
              <input
                className="w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="ex: moi@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <button
                className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
                onClick={onContinueEmail}
                disabled={isLoading}
              >
                Continuer
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <div className="text-sm">ou</div>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button className="w-full rounded-lg border px-4 py-3 font-semibold">Continuer avec Google</button>
              <button className="mt-3 w-full rounded-lg border px-4 py-3 font-semibold">Continuer avec Apple</button>
              <button className="mt-3 w-full rounded-lg border px-4 py-3 font-semibold">Continuer avec Facebook</button>

              <div className="mt-6 text-center">
                <Link className="text-blue-700 underline" href="/">
                  Retour à l’accueil
                </Link>
              </div>
            </>
          )}

          {step === 'login' && (
            <>
              <div className="mb-4 text-sm text-gray-700">
                Email : <b>{cleanEmail}</b>
              </div>

              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <input
                className="w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="8 caractères minimum"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <button
                className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
                onClick={onContinueLogin}
                disabled={isLoading}
              >
                Se connecter
              </button>

              <button className="mt-3 w-full rounded-lg border px-4 py-3 font-semibold" onClick={onBack}>
                Retour
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              <div className="mb-4 text-sm text-gray-700">
                <b>Terminer mon inscription</b>
              </div>

              <label className="block text-sm font-medium mb-2">Nom officiel</label>
              <input
                className="w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="Prénom sur la pièce d'identité"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                className="mt-3 w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="Nom sur la pièce d'identité"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />

              <label className="mt-5 block text-sm font-medium mb-2">Date de naissance</label>
              <input
                className="w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="jj/mm/aaaa"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />

              <label className="mt-5 block text-sm font-medium mb-2">Coordonnées</label>
              <input className="w-full rounded-lg border px-4 py-3 outline-none" value={cleanEmail} disabled />

              <label className="mt-5 block text-sm font-medium mb-2">Mot de passe</label>
              <input
                className="w-full rounded-lg border px-4 py-3 outline-none"
                placeholder="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <button
                className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
                onClick={onAcceptAndContinueRegister}
                disabled={isLoading}
              >
                Accepter et continuer
              </button>

              <button className="mt-3 w-full rounded-lg border px-4 py-3 font-semibold" onClick={onBack}>
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
