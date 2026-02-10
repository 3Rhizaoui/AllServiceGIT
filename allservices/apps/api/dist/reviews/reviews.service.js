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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db.service");
let ReviewsService = class ReviewsService {
    constructor(db) {
        this.db = db;
    }
    async create(clientUserId, dto) {
        const bookingId = String(dto.booking_id);
        const rating = Number(dto.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5)
            throw new Error('rating 1..5');
        const bRes = await this.db.client.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
        const b = bRes.rows[0];
        if (!b)
            throw new common_1.NotFoundException('Booking not found');
        if (b.client_user_id !== clientUserId)
            throw new common_1.ForbiddenException();
        if (b.status !== 'completed')
            throw new Error('Booking not completed');
        const res = await this.db.client.query(`INSERT INTO reviews (booking_id, reviewer_user_id, reviewed_user_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (booking_id) DO UPDATE
         SET rating=EXCLUDED.rating, comment=EXCLUDED.comment
       RETURNING *`, [bookingId, clientUserId, b.artisan_user_id, rating, dto.comment ?? null]);
        await this.db.client.query(`UPDATE artisan_profiles ap
       SET reviews_count = sub.cnt,
           rating_avg = sub.avg
       FROM (
         SELECT reviewed_user_id, COUNT(*) cnt, AVG(rating)::double precision avg
         FROM reviews
         WHERE reviewed_user_id=$1
         GROUP BY reviewed_user_id
       ) sub
       WHERE ap.user_id = sub.reviewed_user_id`, [b.artisan_user_id]);
        return res.rows[0];
    }
    async listForArtisan(artisanUserId) {
        const res = await this.db.client.query(`SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id=r.reviewer_user_id
       WHERE r.reviewed_user_id=$1
       ORDER BY r.created_at DESC
       LIMIT 50`, [artisanUserId]);
        return res.rows;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map