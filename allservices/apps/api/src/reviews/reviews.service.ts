import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db.service';

@Injectable()
export class ReviewsService {
  constructor(private db: DbService) {}

  async create(clientUserId: string, dto: any) {
    const bookingId = String(dto.booking_id);
    const rating = Number(dto.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error('rating 1..5');

    const bRes = await this.db.client.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
    const b = bRes.rows[0];
    if (!b) throw new NotFoundException('Booking not found');
    if (b.client_user_id !== clientUserId) throw new ForbiddenException();
    if (b.status !== 'completed') throw new Error('Booking not completed');

    const res = await this.db.client.query(
      `INSERT INTO reviews (booking_id, reviewer_user_id, reviewed_user_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (booking_id) DO UPDATE
         SET rating=EXCLUDED.rating, comment=EXCLUDED.comment
       RETURNING *`,
      [bookingId, clientUserId, b.artisan_user_id, rating, dto.comment ?? null],
    );

    // update cached stats
    await this.db.client.query(
      `UPDATE artisan_profiles ap
       SET reviews_count = sub.cnt,
           rating_avg = sub.avg
       FROM (
         SELECT reviewed_user_id, COUNT(*) cnt, AVG(rating)::double precision avg
         FROM reviews
         WHERE reviewed_user_id=$1
         GROUP BY reviewed_user_id
       ) sub
       WHERE ap.user_id = sub.reviewed_user_id`,
      [b.artisan_user_id],
    );

    return res.rows[0];
  }

  async listForArtisan(artisanUserId: string) {
    const res = await this.db.client.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.first_name, u.last_name, u.avatar_url
       FROM reviews r
       JOIN users u ON u.id=r.reviewer_user_id
       WHERE r.reviewed_user_id=$1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [artisanUserId],
    );
    return res.rows;
  }
}
