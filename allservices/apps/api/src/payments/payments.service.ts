import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { DbService } from '../db.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private db: DbService) {
    const key = process.env.STRIPE_SECRET_KEY;
    // Allow boot without Stripe configured (dev), but payment endpoints will error.
    this.stripe = new Stripe(key ?? 'sk_test_placeholder', {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createIntent(clientUserId: string, bookingId: string) {
    const bookingRes = await this.db.client.query(
      `SELECT b.id, b.status, b.client_user_id, s.price_amount
       FROM bookings b
       JOIN services s ON s.id=b.service_id
       WHERE b.id=$1`,
      [bookingId],
    );
    const booking = bookingRes.rows[0];
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.client_user_id !== clientUserId) throw new NotFoundException('Booking not found');

    const amountEuros = Number(booking.price_amount);
    const amountCents = Math.round(amountEuros * 100);

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY missing. Add it to apps/api/.env');
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: { booking_id: bookingId },
      automatic_payment_methods: { enabled: true },
    });

    await this.db.client.query(
      `INSERT INTO payments (booking_id, provider, provider_payment_intent_id, amount_total, currency, platform_fee_amount, status)
       VALUES ($1,'stripe',$2,$3,'EUR',0,'requires_payment')
       ON CONFLICT (booking_id) DO UPDATE
         SET provider_payment_intent_id=EXCLUDED.provider_payment_intent_id,
             amount_total=EXCLUDED.amount_total,
             status='requires_payment',
             updated_at=NOW();`,
      [bookingId, intent.id, amountEuros],
    );

    return { client_secret: intent.client_secret, payment_intent_id: intent.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Accept but do nothing
      return { ok: true, skipped: true };
    }

    if (!signature) throw new Error('Missing Stripe signature');

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = (pi.metadata && (pi.metadata as any).booking_id) as string | undefined;
      if (bookingId) {
        await this.db.client.query(
          `UPDATE payments SET status='succeeded', updated_at=NOW() WHERE booking_id=$1`,
          [bookingId],
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = (pi.metadata && (pi.metadata as any).booking_id) as string | undefined;
      if (bookingId) {
        await this.db.client.query(
          `UPDATE payments SET status='failed', updated_at=NOW() WHERE booking_id=$1`,
          [bookingId],
        );
      }
    }

    return { ok: true };
  }
}
