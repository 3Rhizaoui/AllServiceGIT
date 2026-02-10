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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const db_service_1 = require("../db.service");
function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}
function normalizeRole(input) {
    if (input === 'client')
        return 'customer';
    if (input === 'artisan')
        return 'pro';
    return input;
}
function rolesToStoredRole(roles) {
    const r = (roles ?? ['customer']).map(normalizeRole);
    const hasCustomer = r.includes('customer');
    const hasPro = r.includes('pro');
    if (hasCustomer && hasPro)
        return 'both';
    if (hasPro)
        return 'pro';
    return 'customer';
}
function storedRoleToRoles(role) {
    if (role === 'both' || role === 'admin')
        return ['customer', 'pro'];
    if (role === 'pro')
        return ['pro'];
    return ['customer'];
}
let AuthService = class AuthService {
    constructor(db, jwt) {
        this.db = db;
        this.jwt = jwt;
    }
    signToken(payload) {
        return this.jwt.sign(payload);
    }
    async resolveBirthDateColumn() {
        const candidates = ['birth_date', 'date_of_birth', 'birthdate'];
        const r = await this.db.client.query(`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = any($1::text[])
      `, [candidates]);
        const found = (r.rows ?? []).map((x) => x.column_name);
        for (const c of candidates) {
            if (found.includes(c))
                return c;
        }
        return null;
    }
    async emailExists(email) {
        const clean = normalizeEmail(email);
        if (!clean)
            return { exists: false };
        const r = await this.db.client.query('select 1 from users where email = $1 limit 1', [clean]);
        return { exists: (r.rowCount ?? 0) > 0 };
    }
    async register(dto) {
        const email = normalizeEmail(dto.email);
        if (!email)
            throw new common_1.BadRequestException('Email requis');
        if (!dto.password || dto.password.length < 8) {
            throw new common_1.BadRequestException('Mot de passe trop court (min 8)');
        }
        const exists = await this.db.client.query('select id from users where email = $1 limit 1', [email]);
        if ((exists.rowCount ?? 0) > 0) {
            throw new common_1.BadRequestException('User already exists');
        }
        const storedRole = rolesToStoredRole(dto.roles);
        const hashed = await bcrypt.hash(dto.password, 10);
        const birthCol = await this.resolveBirthDateColumn();
        const birthValue = dto.birth_date ??
            dto.date_of_birth ??
            dto.birthdate ??
            null;
        const baseCols = ['email', 'password_hash', 'role', 'first_name', 'last_name'];
        const baseVals = [email, hashed, storedRole, dto.first_name ?? '', dto.last_name ?? ''];
        let cols = [...baseCols];
        let placeholders = baseVals.map((_, i) => `$${i + 1}`);
        let values = [...baseVals];
        if (birthCol) {
            cols.push(birthCol);
            values.push(birthValue);
            placeholders.push(`$${values.length}`);
        }
        const created = await this.db.client.query(`
      insert into users (${cols.join(', ')})
      values (${placeholders.join(', ')})
      returning id, email, role, first_name, last_name, is_email_verified
      `, values);
        const userRow = created.rows?.[0];
        const token = this.signToken({
            sub: String(userRow.id),
            email: userRow.email,
            role: userRow.role,
        });
        return {
            user: {
                id: userRow.id,
                email: userRow.email,
                role: userRow.role,
                roles: storedRoleToRoles(userRow.role),
                first_name: userRow.first_name ?? '',
                last_name: userRow.last_name ?? '',
                is_email_verified: !!userRow.is_email_verified,
            },
            access_token: token,
        };
    }
    async login(dto) {
        const email = normalizeEmail(dto.email);
        if (!email)
            throw new common_1.BadRequestException('Email requis');
        const r = await this.db.client.query(`
      select id, email, password_hash, role, first_name, last_name, is_email_verified
      from users
      where email = $1
      limit 1
      `, [email]);
        const user = r.rows?.[0];
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(dto.password, user.password_hash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const token = this.signToken({
            sub: String(user.id),
            email: user.email,
            role: user.role,
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                roles: storedRoleToRoles(user.role),
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                is_email_verified: !!user.is_email_verified,
            },
            access_token: token,
        };
    }
    async me(userId) {
        if (!userId)
            throw new common_1.UnauthorizedException('Missing token subject');
        const r = await this.db.client.query(`
      select id, email, role, first_name, last_name, is_email_verified
      from users
      where id = $1
      limit 1
      `, [userId]);
        const user = r.rows?.[0];
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            roles: storedRoleToRoles(user.role),
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            is_email_verified: !!user.is_email_verified,
        };
    }
    async upgradeRoles(userId, add) {
        if (!userId)
            throw new common_1.UnauthorizedException('Missing token subject');
        const addNorm = normalizeRole(add);
        const r0 = await this.db.client.query(`
      select id, email, role, first_name, last_name, is_email_verified
      from users
      where id = $1
      limit 1
      `, [userId]);
        const current = r0.rows?.[0];
        if (!current)
            throw new common_1.BadRequestException('User not found');
        const currentRoles = storedRoleToRoles(current.role);
        const nextRoles = Array.from(new Set([...currentRoles, addNorm]));
        const nextStored = rolesToStoredRole(nextRoles);
        const upd = await this.db.client.query(`
      update users
      set role = $2
      where id = $1
      returning id, email, role, first_name, last_name, is_email_verified
      `, [userId, nextStored]);
        const updated = upd.rows?.[0];
        const token = this.signToken({
            sub: String(updated.id),
            email: updated.email,
            role: updated.role,
        });
        return {
            user: {
                id: updated.id,
                email: updated.email,
                role: updated.role,
                roles: storedRoleToRoles(updated.role),
                first_name: updated.first_name ?? '',
                last_name: updated.last_name ?? '',
                is_email_verified: !!updated.is_email_verified,
            },
            access_token: token,
        };
    }
    async logout(_userId) {
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map