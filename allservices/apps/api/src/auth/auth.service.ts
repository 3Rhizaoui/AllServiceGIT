import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DbService } from '../db.service';
import { AppRole, LoginDto, RegisterDto } from './dto';

type StoredRole = 'customer' | 'pro' | 'both' | 'admin';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

function normalizeRole(input: AppRole): AppRole {
  // compat historique si tu as eu client/artisan
  if (input === ('client' as any)) return 'customer';
  if (input === ('artisan' as any)) return 'pro';
  return input;
}

function rolesToStoredRole(roles?: AppRole[]): StoredRole {
  const r = (roles ?? ['customer']).map(normalizeRole);
  const hasCustomer = r.includes('customer');
  const hasPro = r.includes('pro');
  if (hasCustomer && hasPro) return 'both';
  if (hasPro) return 'pro';
  return 'customer';
}

function storedRoleToRoles(role: StoredRole): AppRole[] {
  if (role === 'both' || role === 'admin') return ['customer', 'pro'];
  if (role === 'pro') return ['pro'];
  return ['customer'];
}

@Injectable()
export class AuthService {
  constructor(private db: DbService, private jwt: JwtService) {}

  private signToken(payload: { sub: string; email: string; role: StoredRole }) {
    return this.jwt.sign(payload);
  }

  /**
   * Détecte la colonne date de naissance existante dans la table users.
   * Retourne le nom de colonne SQL (ex: birth_date) ou null si aucune trouvée.
   */
  private async resolveBirthDateColumn(): Promise<string | null> {
    // candidates (ton historique montre date_of_birth et birth_date)
    const candidates = ['birth_date', 'date_of_birth', 'birthdate'];

    const r = await this.db.client.query(
      `
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = any($1::text[])
      `,
      [candidates],
    );

    const found = (r.rows ?? []).map((x: any) => x.column_name);
    // priorité: birth_date > date_of_birth > birthdate
    for (const c of candidates) {
      if (found.includes(c)) return c;
    }
    return null;
  }

  async emailExists(email: string) {
    const clean = normalizeEmail(email);
    if (!clean) return { exists: false };

    const r = await this.db.client.query(
      'select 1 from users where email = $1 limit 1',
      [clean],
    );

    return { exists: (r.rowCount ?? 0) > 0 };
  }

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    if (!email) throw new BadRequestException('Email requis');
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Mot de passe trop court (min 8)');
    }

    const exists = await this.db.client.query(
      'select id from users where email = $1 limit 1',
      [email],
    );
    if ((exists.rowCount ?? 0) > 0) {
      throw new BadRequestException('User already exists');
    }

    const storedRole = rolesToStoredRole(dto.roles);
    const hashed = await bcrypt.hash(dto.password, 10);

    // ✅ on détecte la colonne date de naissance réellement existante
    const birthCol = await this.resolveBirthDateColumn();

    // Valeur envoyée par le front (on accepte birth_date / date_of_birth / birthdate selon ton DTO)
    const birthValue =
      (dto as any).birth_date ??
      (dto as any).date_of_birth ??
      (dto as any).birthdate ??
      null;

    // Base colonnes communes
    const baseCols = ['email', 'password_hash', 'role', 'first_name', 'last_name'];
    const baseVals = [email, hashed, storedRole, dto.first_name ?? '', dto.last_name ?? ''];

    // On construit dynamiquement la requête
    let cols = [...baseCols];
    let placeholders = baseVals.map((_, i) => `$${i + 1}`);
    let values = [...baseVals];

    if (birthCol) {
      cols.push(birthCol);
      values.push(birthValue);
      placeholders.push(`$${values.length}`);
    }

    const created = await this.db.client.query(
      `
      insert into users (${cols.join(', ')})
      values (${placeholders.join(', ')})
      returning id, email, role, first_name, last_name, is_email_verified
      `,
      values,
    );

    const userRow = created.rows?.[0];
    const token = this.signToken({
      sub: String(userRow.id),
      email: userRow.email,
      role: userRow.role as StoredRole,
    });

    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role as StoredRole,
        roles: storedRoleToRoles(userRow.role as StoredRole),
        first_name: userRow.first_name ?? '',
        last_name: userRow.last_name ?? '',
        is_email_verified: !!userRow.is_email_verified,
      },
      access_token: token,
    };
  }

  async login(dto: LoginDto) {
    const email = normalizeEmail(dto.email);
    if (!email) throw new BadRequestException('Email requis');

    const r = await this.db.client.query(
      `
      select id, email, password_hash, role, first_name, last_name, is_email_verified
      from users
      where email = $1
      limit 1
      `,
      [email],
    );

    const user = r.rows?.[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken({
      sub: String(user.id),
      email: user.email,
      role: user.role as StoredRole,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as StoredRole,
        roles: storedRoleToRoles(user.role as StoredRole),
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        is_email_verified: !!user.is_email_verified,
      },
      access_token: token,
    };
  }

  async me(userId: string) {
    if (!userId) throw new UnauthorizedException('Missing token subject');

    const r = await this.db.client.query(
      `
      select id, email, role, first_name, last_name, is_email_verified
      from users
      where id = $1
      limit 1
      `,
      [userId],
    );

    const user = r.rows?.[0];
    if (!user) throw new BadRequestException('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role as StoredRole,
      roles: storedRoleToRoles(user.role as StoredRole),
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      is_email_verified: !!user.is_email_verified,
    };
  }

  async upgradeRoles(userId: string, add: AppRole) {
    if (!userId) throw new UnauthorizedException('Missing token subject');

    const addNorm = normalizeRole(add);

    const r0 = await this.db.client.query(
      `
      select id, email, role, first_name, last_name, is_email_verified
      from users
      where id = $1
      limit 1
      `,
      [userId],
    );
    const current = r0.rows?.[0];
    if (!current) throw new BadRequestException('User not found');

    const currentRoles = storedRoleToRoles(current.role as StoredRole);
    const nextRoles = Array.from(new Set([...currentRoles, addNorm])) as AppRole[];
    const nextStored: StoredRole = rolesToStoredRole(nextRoles);

    const upd = await this.db.client.query(
      `
      update users
      set role = $2
      where id = $1
      returning id, email, role, first_name, last_name, is_email_verified
      `,
      [userId, nextStored],
    );

    const updated = upd.rows?.[0];

    const token = this.signToken({
      sub: String(updated.id),
      email: updated.email,
      role: updated.role as StoredRole,
    });

    return {
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role as StoredRole,
        roles: storedRoleToRoles(updated.role as StoredRole),
        first_name: updated.first_name ?? '',
        last_name: updated.last_name ?? '',
        is_email_verified: !!updated.is_email_verified,
      },
      access_token: token,
    };
  }
  async logout(_userId: string) {
    return { ok: true };
  }
}
