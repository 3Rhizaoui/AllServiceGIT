import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../db.service';
import { UpdateMeDto } from './dto';

type AppRole = 'customer' | 'pro';
type StoredRole = AppRole | 'both' | 'admin';

function normalizeRoles(input: any): AppRole[] {
  const roles: string[] = [];

  if (Array.isArray(input?.roles)) roles.push(...input.roles);
  else if (typeof input?.role === 'string') roles.push(input.role);

  const mapped = roles.map((r) => {
    if (r === 'client') return 'customer';
    if (r === 'artisan') return 'pro';
    return r;
  });

  const cleaned = Array.from(new Set(mapped)).filter((r) => r === 'customer' || r === 'pro') as AppRole[];
  return cleaned.length ? cleaned : ['customer'];
}

function toStoredRole(roles: AppRole[]): StoredRole {
  const hasCustomer = roles.includes('customer');
  const hasPro = roles.includes('pro');
  if (hasCustomer && hasPro) return 'both';
  if (hasPro) return 'pro';
  return 'customer';
}

function storedRoleToRoles(role: StoredRole): AppRole[] {
  if (role === 'both') return ['customer', 'pro'];
  if (role === 'admin') return ['customer', 'pro'];
  if (role === 'pro') return ['pro'];
  return ['customer'];
}

@Injectable()
export class UsersService {
  constructor(private db: DbService) {}

  async me(userId: string) {
    const res = await this.db.client.query(
      `SELECT id, email, role, first_name, last_name, avatar_url, is_email_verified
       FROM users WHERE id=$1`,
      [userId],
    );
    const u = res.rows[0];
    if (!u) return null;
    return { ...u, roles: storedRoleToRoles(u.role as StoredRole) };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    // get current user
    const current = await this.db.client.query(`SELECT id, role FROM users WHERE id=$1`, [userId]);
    const cur = current.rows[0];
    if (!cur) throw new BadRequestException('User not found');

    const setFirst = dto.first_name ?? null;
    const setLast = dto.last_name ?? null;

    // roles update (optional)
    let newStoredRole: StoredRole | null = null;
    if (dto.roles || dto.role) {
      const roles = normalizeRoles(dto);
      newStoredRole = toStoredRole(roles);
    }

    const res = await this.db.client.query(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           role       = COALESCE($4, role),
           updated_at = now()
       WHERE id=$1
       RETURNING id, email, role, first_name, last_name, avatar_url, is_email_verified`,
      [userId, setFirst, setLast, newStoredRole,],
    );

    const u = res.rows[0];

    // ✅ si devient pro/both => créer profil pro (artisan_profiles) si absent
    const rolesNow = storedRoleToRoles(u.role as StoredRole);
    if (rolesNow.includes('pro')) {
      await this.db.client.query(
        `INSERT INTO artisan_profiles (user_id, bio)
         VALUES ($1,$2)
         ON CONFLICT (user_id) DO NOTHING;`,
        [u.id, ''],
      );
    }

    return { ...u, roles: storedRoleToRoles(u.role as StoredRole) };
  }
}
