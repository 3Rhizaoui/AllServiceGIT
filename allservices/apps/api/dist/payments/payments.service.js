"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = require("stripe");
const db_service_1 = require("../db.service");
let PaymentsService = class PaymentsService {
    constructor(db) {
        this.db = db;
        const key = process.env.STRIPE_SECRET_KEY;
        this.stripe = new stripe_1.default(key ?? 'sk_test_placeholder', {
            apiVersion: '2023-10-16',
        });
    }
    async createIntent(clientUserId, bookingId) {
        const bookingRes = await this.db.client.query(`SELECT b.id, b.status, b.client_user_id, s.price_amount
       FROM bookings b
       JOIN services s ON s.id=b.service_id
       WHERE b.id=$1`, [bookingId]);
        const booking = bookingRes.rows[0];
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.client_user_id !== clientUserId)
            throw new common_1.NotFoundException('Booking not found');
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
        await this.db.client.query(`INSERT INTO payments (booking_id, provider, provider_payment_intent_id, amount_total, currency, platform_fee_amount, status)
       VALUES ($1,'stripe',$2,$3,'EUR',0,'requires_payment')
       ON CONFLICT (booking_id) DO UPDATE
         SET provider_payment_intent_id=EXCLUDED.provider_payment_intent_id,
             amount_total=EXCLUDED.amount_total,
             status='requires_payment',
             updated_at=NOW();`, [bookingId, intent.id, amountEuros]);
        return { client_secret: intent.client_secret, payment_intent_id: intent.id };
    }
    async handleWebhook(rawBody, signature) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return { ok: true, skipped: true };
        }
        if (!signature)
            throw new Error('Missing Stripe signature');
        const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            const bookingId = (pi.metadata && pi.metadata.booking_id);
            if (bookingId) {
                await this.db.client.query(`UPDATE payments SET status='succeeded', updated_at=NOW() WHERE booking_id=$1`, [bookingId]);
            }
        }
        if (event.type === 'payment_intent.payment_failed') {
            const pi = event.data.object;
            const bookingId = (pi.metadata && pi.metadata.booking_id);
            if (bookingId) {
                await this.db.client.query(`UPDATE payments SET status='failed', updated_at=NOW() WHERE booking_id=$1`, [bookingId]);
            }
        }
        return { ok: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map