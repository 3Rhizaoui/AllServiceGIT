'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from '../../shared/auth.module.css';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

type Booking = { id: string; status: string; start_at: string; }

function PayForm({ bookingId, clientSecret }: { bookingId: string; clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Carte manquante');
      const res = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (res.error) throw new Error(res.error.message || 'Paiement refusé');
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <p><b>Paiement confirmé ✅</b></p>
        <p>Tu peux retrouver cette réservation dans <Link href="/trips">Mes réservations</Link>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      {error && <p className={styles.error}>Erreur: {error}</p>}
      <label>
        Carte
        <div style={{ padding: 12, borderRadius: 14, border: '1px solid #ddd', background: '#fff' }}>
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </label>
      <button disabled={!stripe || loading} className={styles.primary} type="submit">
        {loading ? 'Paiement…' : 'Payer (test)'}
      </button>
      <p className={styles.hint}>Mode test Stripe. Utilise la carte 4242 4242 4242 4242, date future, CVC quelconque.</p>
    </form>
  );
}

export default function BookingPayClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return pk ? loadStripe(pk) : null;
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const b = await apiFetch<Booking>(`/bookings/${id}`);
        setBooking(b);
        const intent = await apiFetch<{ client_secret: string }>(`/payments/create-intent`, {
          method: 'POST',
          body: JSON.stringify({ booking_id: id }),
        });
        setClientSecret(intent.client_secret);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}><p>Chargement…</p></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1>Paiement</h1>
          <p className={styles.error}>Erreur: {error || 'Réservation introuvable'}</p>
          <p><Link href="/login?next=/trips">Connexion</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1>Paiement</h1>
        <p className={styles.sub}>Réservation {booking.id.slice(0, 8)} • {new Date(booking.start_at).toLocaleString()} • Statut: {booking.status}</p>

        {!stripePromise ? (
          <div>
            <p className={styles.error}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant.</p>
            <p>Ajoute ta clé publishable Stripe dans <code>apps/web/.env</code> puis relance le serveur.</p>
          </div>
        ) : !clientSecret ? (
          <p>Création du PaymentIntent…</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PayForm bookingId={id} clientSecret={clientSecret} />
          </Elements>
        )}

        <p><Link href="/trips">← Retour réservations</Link></p>
      </div>
    </div>
  );
}
