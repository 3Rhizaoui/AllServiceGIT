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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db.service");
function num(v) {
    if (v === undefined || v === null || v === '')
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
let BookingsService = class BookingsService {
    constructor(db) {
        this.db = db;
    }
    async create(clientUserId, dto) {
        const service_id = String(dto.service_id);
        const start_at = new Date(String(dto.start_at));
        if (Number.isNaN(start_at.getTime()))
            throw new Error('Invalid start_at');
        const serviceRes = await this.db.client.query(`SELECT s.id, s.artisan_user_id, s.price_amount
       FROM services s
       WHERE s.id=$1 AND s.is_active=TRUE`, [service_id]);
        const service = serviceRes.rows[0];
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        const addr = dto.address || {};
        const lat = num(addr.lat);
        const lng = num(addr.lng);
        const addressRes = await this.db.client.query(`INSERT INTO addresses (user_id,label,address_line1,address_line2,city,postal_code,country,location)
       VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $8::double precision IS NULL OR $9::double precision IS NULL THEN NULL
                                          ELSE ST_SetSRID(ST_MakePoint($9,$8),4326)::geography END)
       RETURNING id`, [
            clientUserId,
            addr.label ?? null,
            addr.address_line1 ?? null,
            addr.address_line2 ?? null,
            addr.city ?? null,
            addr.postal_code ?? null,
            addr.country ?? 'FR',
            lat ?? null,
            lng ?? null,
        ]);
        const bookingRes = await this.db.client.query(`INSERT INTO bookings (client_user_id, artisan_user_id, service_id, address_id, start_at, status, client_note)
       VALUES ($1,$2,$3,$4,$5,'pending',$6)
       RETURNING *`, [clientUserId, service.artisan_user_id, service_id, addressRes.rows[0].id, start_at.toISOString(), dto.client_note ?? null]);
        return bookingRes.rows[0];
    }
    async listForClient(clientUserId) {
        const res = await this.db.client.query(`SELECT b.*, s.title AS service_title,
              u.first_name AS artisan_first_name, u.last_name AS artisan_last_name
       FROM bookings b
       JOIN services s ON s.id=b.service_id
       JOIN users u ON u.id=b.artisan_user_id
       WHERE b.client_user_id=$1
       ORDER BY b.created_at DESC`, [clientUserId]);
        return res.rows;
    }
    async listForArtisan(artisanUserId) {
        const res = await this.db.client.query(`SELECT b.*, s.title AS service_title,
              u.first_name AS client_first_name, u.last_name AS client_last_name
       FROM bookings b
       JOIN services s ON s.id=b.service_id
       JOIN users u ON u.id=b.client_user_id
       WHERE b.artisan_user_id=$1
       ORDER BY b.created_at DESC`, [artisanUserId]);
        return res.rows;
    }
    async getById(userId, bookingId) {
        const res = await this.db.client.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
        const b = res.rows[0];
        if (!b)
            throw new common_1.NotFoundException('Booking not found');
        if (b.client_user_id !== userId && b.artisan_user_id !== userId)
            throw new common_1.ForbiddenException();
        return b;
    }
    async cancelAsClient(clientUserId, bookingId) {
        const b = await this.getById(clientUserId, bookingId);
        if (b.client_user_id !== clientUserId)
            throw new common_1.ForbiddenException();
        if (b.status === 'completed')
            throw new Error('Cannot cancel completed booking');
        const res = await this.db.client.query(`UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE id=$1 RETURNING *`, [bookingId]);
        return res.rows[0];
    }
    async acceptAsArtisan(artisanUserId, bookingId) {
        const b = await this.getById(artisanUserId, bookingId);
        if (b.artisan_user_id !== artisanUserId)
            throw new common_1.ForbiddenException();
        const res = await this.db.client.query(`UPDATE bookings SET status='accepted', updated_at=NOW() WHERE id=$1 AND status='pending' RETURNING *`, [bookingId]);
        return res.rows[0] ?? null;
    }
    async rejectAsArtisan(artisanUserId, bookingId) {
        const b = await this.getById(artisanUserId, bookingId);
        if (b.artisan_user_id !== artisanUserId)
            throw new common_1.ForbiddenException();
        const res = await this.db.client.query(`UPDATE bookings SET status='cancelled', updated_at=NOW() WHERE id=$1 AND status='pending' RETURNING *`, [bookingId]);
        return res.rows[0] ?? null;
    }
    async completeAsArtisan(artisanUserId, bookingId) {
        const b = await this.getById(artisanUserId, bookingId);
        if (b.artisan_user_id !== artisanUserId)
            throw new common_1.ForbiddenException();
        const res = await this.db.client.query(`UPDATE bookings SET status='completed', updated_at=NOW() WHERE id=$1 AND status='accepted' RETURNING *`, [bookingId]);
        return res.rows[0] ?? null;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map