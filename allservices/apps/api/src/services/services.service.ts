import { Injectable } from '@nestjs/common';
import { DbService } from '../db.service';

function num(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

@Injectable()
export class ServicesService {
  constructor(private db: DbService) {}

  async categories() {
    const res = await this.db.client.query(
      `SELECT id, name, slug FROM service_categories ORDER BY name ASC`,
    );
    return res.rows;
  }

  async listByArtisan(artisanId: string) {
    const res = await this.db.client.query(
      `SELECT s.*, sc.name AS category_name, sc.slug AS category_slug
       FROM services s JOIN service_categories sc ON sc.id=s.category_id
       WHERE s.artisan_user_id=$1 AND s.is_active=TRUE
       ORDER BY s.created_at DESC`,
      [artisanId],
    );
    return res.rows;
  }

  async create(artisanUserId: string, dto: any) {
    const category_slug = String(dto.category_slug);
    const cat = await this.db.client.query(`SELECT id FROM service_categories WHERE slug=$1`, [category_slug]);
    if (!cat.rows[0]) throw new Error('Unknown category_slug');

    const res = await this.db.client.query(
      `INSERT INTO services (artisan_user_id, category_id, title, description, price_type, price_amount, duration_minutes,
        is_emergency_available, is_travel_included, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
       RETURNING *`,
      [
        artisanUserId,
        cat.rows[0].id,
        String(dto.title),
        dto.description ? String(dto.description) : null,
        String(dto.price_type ?? 'starting_from'),
        num(dto.price_amount) ?? 0,
        num(dto.duration_minutes) ?? null,
        String(dto.is_emergency_available) === 'true' || dto.is_emergency_available === true,
        String(dto.is_travel_included) === 'true' || dto.is_travel_included === true,
      ],
    );
    return res.rows[0];
  }

  async update(artisanUserId: string, id: string, dto: any) {
    // Only allow updating own service
    const res = await this.db.client.query(
      `UPDATE services SET
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        price_type = COALESCE($5, price_type),
        price_amount = COALESCE($6, price_amount),
        duration_minutes = COALESCE($7, duration_minutes),
        is_emergency_available = COALESCE($8, is_emergency_available),
        is_travel_included = COALESCE($9, is_travel_included),
        updated_at = NOW()
       WHERE id=$1 AND artisan_user_id=$2
       RETURNING *`,
      [
        id,
        artisanUserId,
        dto.title ?? null,
        dto.description ?? null,
        dto.price_type ?? null,
        num(dto.price_amount) ?? null,
        num(dto.duration_minutes) ?? null,
        dto.is_emergency_available ?? null,
        dto.is_travel_included ?? null,
      ],
    );
    return res.rows[0] ?? null;
  }

  async remove(artisanUserId: string, id: string) {
    const res = await this.db.client.query(
      `UPDATE services SET is_active=FALSE, updated_at=NOW() WHERE id=$1 AND artisan_user_id=$2 RETURNING id`,
      [id, artisanUserId],
    );
    return { ok: !!res.rows[0] };
  }
}
