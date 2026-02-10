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
exports.ArtisansService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db.service");
function num(v) {
    if (v === undefined || v === null || v === '')
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
let ArtisansService = class ArtisansService {
    constructor(db) {
        this.db = db;
    }
    async list(raw) {
        const category = raw.category ? String(raw.category) : undefined;
        const lat = num(raw.lat);
        const lng = num(raw.lng);
        const radius_km = num(raw.radius_km) ?? 10;
        const price_min = num(raw.price_min);
        const price_max = num(raw.price_max);
        const rating_min = num(raw.rating_min);
        const verified = raw.verified !== undefined ? String(raw.verified) === 'true' : undefined;
        const sort = raw.sort ? String(raw.sort) : 'distance';
        const page = Math.max(1, num(raw.page) ?? 1);
        const limit = Math.min(50, Math.max(1, num(raw.limit) ?? 20));
        const offset = (page - 1) * limit;
        const values = [];
        const where = ["u.role='artisan'"];
        if (verified !== undefined) {
            values.push(verified);
            where.push(`ap.is_verified = $${values.length}`);
        }
        if (rating_min !== undefined) {
            values.push(rating_min);
            where.push(`ap.rating_avg >= $${values.length}`);
        }
        if (category || price_min !== undefined || price_max !== undefined) {
            const serviceWhere = ['s.is_active = TRUE'];
            if (category) {
                values.push(category);
                serviceWhere.push(`sc.slug = $${values.length}`);
            }
            if (price_min !== undefined) {
                values.push(price_min);
                serviceWhere.push(`s.price_amount >= $${values.length}`);
            }
            if (price_max !== undefined) {
                values.push(price_max);
                serviceWhere.push(`s.price_amount <= $${values.length}`);
            }
            where.push(`EXISTS (
          SELECT 1 FROM services s
          JOIN service_categories sc ON sc.id = s.category_id
          WHERE s.artisan_user_id = u.id AND ${serviceWhere.join(' AND ')}
        )`);
        }
        let distanceSelect = 'NULL::double precision AS distance_km';
        let latLngSelect = `NULL::double precision AS lat, NULL::double precision AS lng`;
        if (lat !== undefined && lng !== undefined) {
            values.push(lng, lat);
            const pointExpr = `ST_SetSRID(ST_MakePoint($${values.length - 1}, $${values.length}), 4326)::geography`;
            values.push(radius_km * 1000);
            where.push(`EXISTS (
          SELECT 1 FROM artisan_service_areas asa
          WHERE asa.artisan_user_id = u.id
            AND asa.center IS NOT NULL
            AND ST_DWithin(asa.center, ${pointExpr}, GREATEST(asa.radius_km, 1) * 1000)
        )`);
            distanceSelect = `(
        SELECT MIN(ST_Distance(asa.center, ${pointExpr})/1000)
        FROM artisan_service_areas asa
        WHERE asa.artisan_user_id = u.id AND asa.center IS NOT NULL
      ) AS distance_km`;
            latLngSelect = `(
        SELECT ST_Y(asa.center::geometry)
        FROM artisan_service_areas asa
        WHERE asa.artisan_user_id = u.id AND asa.center IS NOT NULL
        ORDER BY ST_Distance(asa.center, ${pointExpr}) ASC
        LIMIT 1
      ) AS lat,
      (
        SELECT ST_X(asa.center::geometry)
        FROM artisan_service_areas asa
        WHERE asa.artisan_user_id = u.id AND asa.center IS NOT NULL
        ORDER BY ST_Distance(asa.center, ${pointExpr}) ASC
        LIMIT 1
      ) AS lng`;
        }
        let orderBy = 'ap.rating_avg DESC';
        if (sort === 'distance')
            orderBy = 'distance_km ASC NULLS LAST';
        if (sort === 'price')
            orderBy = 'min_price ASC NULLS LAST';
        if (sort === 'rating')
            orderBy = 'ap.rating_avg DESC';
        if (sort === 'newest')
            orderBy = 'u.created_at DESC';
        const sql = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        ap.business_name,
        ap.bio,
        ap.is_verified,
        ap.rating_avg,
        ap.reviews_count,
        (${distanceSelect}),
        ${latLngSelect},
        (
          SELECT MIN(s.price_amount)
          FROM services s
          WHERE s.artisan_user_id = u.id AND s.is_active = TRUE
        ) AS min_price
      FROM users u
      JOIN artisan_profiles ap ON ap.user_id = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset};
    `;
        const res = await this.db.client.query(sql, values);
        return { page, limit, items: res.rows };
    }
    async getById(id) {
        const artisanRes = await this.db.client.query(`SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        ap.business_name,
        ap.bio,
        ap.years_experience,
        ap.is_verified,
        ap.rating_avg,
        ap.reviews_count,
        ap.base_travel_fee
      FROM users u
      JOIN artisan_profiles ap ON ap.user_id = u.id
      WHERE u.id=$1 AND u.role='artisan'`, [id]);
        const artisan = artisanRes.rows[0];
        if (!artisan)
            return null;
        const services = await this.db.client.query(`SELECT s.*, sc.name AS category_name, sc.slug AS category_slug
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       WHERE s.artisan_user_id=$1 AND s.is_active=TRUE
       ORDER BY s.created_at DESC`, [id]);
        const reviews = await this.db.client.query(`SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_user_id
       WHERE r.reviewed_user_id=$1
       ORDER BY r.created_at DESC
       LIMIT 20`, [id]);
        const areas = await this.db.client.query(`SELECT id, area_name, radius_km,
              ST_Y(center::geometry) AS lat,
              ST_X(center::geometry) AS lng
       FROM artisan_service_areas
       WHERE artisan_user_id=$1`, [id]);
        return { artisan, services: services.rows, reviews: reviews.rows, service_areas: areas.rows };
    }
    async upsertMyProfile(userId, dto) {
        const { business_name, bio } = dto;
        const res = await this.db.client.query(`UPDATE artisan_profiles
       SET business_name = COALESCE($2, business_name),
           bio = COALESCE($3, bio),
           updated_at = NOW()
       WHERE user_id=$1
       RETURNING *`, [userId, business_name ?? null, bio ?? null]);
        return res.rows[0];
    }
    async addServiceArea(userId, dto) {
        const area_name = dto.area_name ? String(dto.area_name) : null;
        const radius_km = num(dto.radius_km) ?? 10;
        const lat = num(dto.lat);
        const lng = num(dto.lng);
        if (lat === undefined || lng === undefined)
            throw new Error('lat/lng required');
        const res = await this.db.client.query(`INSERT INTO artisan_service_areas (artisan_user_id, area_name, center, radius_km)
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography, $5)
       RETURNING id, area_name, radius_km, ST_Y(center::geometry) AS lat, ST_X(center::geometry) AS lng`, [userId, area_name, lng, lat, radius_km]);
        return res.rows[0];
    }
};
exports.ArtisansService = ArtisansService;
exports.ArtisansService = ArtisansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], ArtisansService);
//# sourceMappingURL=artisans.service.js.map