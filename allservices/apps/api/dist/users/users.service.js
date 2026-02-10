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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../db.service");
function normalizeRoles(input) {
    const roles = [];
    if (Array.isArray(input?.roles))
        roles.push(...input.roles);
    else if (typeof input?.role === 'string')
        roles.push(input.role);
    const mapped = roles.map((r) => {
        if (r === 'client')
            return 'customer';
        if (r === 'artisan')
            return 'pro';
        return r;
    });
    const cleaned = Array.from(new Set(mapped)).filter((r) => r === 'customer' || r === 'pro');
    return cleaned.length ? cleaned : ['customer'];
}
function toStoredRole(roles) {
    const hasCustomer = roles.includes('customer');
    const hasPro = roles.includes('pro');
    if (hasCustomer && hasPro)
        return 'both';
    if (hasPro)
        return 'pro';
    return 'customer';
}
function storedRoleToRoles(role) {
    if (role === 'both')
        return ['customer', 'pro'];
    if (role === 'admin')
        return ['customer', 'pro'];
    if (role === 'pro')
        return ['pro'];
    return ['customer'];
}
let UsersService = class UsersService {
    constructor(db) {
        this.db = db;
    }
    async me(userId) {
        const res = await this.db.client.query(`SELECT id, email, role, first_name, last_name, avatar_url, is_email_verified
       FROM users WHERE id=$1`, [userId]);
        const u = res.rows[0];
        if (!u)
            return null;
        return { ...u, roles: storedRoleToRoles(u.role) };
    }
    async updateMe(userId, dto) {
        const current = await this.db.client.query(`SELECT id, role FROM users WHERE id=$1`, [userId]);
        const cur = current.rows[0];
        if (!cur)
            throw new common_1.BadRequestException('User not found');
        const setFirst = dto.first_name ?? null;
        const setLast = dto.last_name ?? null;
        let newStoredRole = null;
        if (dto.roles || dto.role) {
            const roles = normalizeRoles(dto);
            newStoredRole = toStoredRole(roles);
        }
        const res = await this.db.client.query(`UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           role       = COALESCE($4, role),
           updated_at = now()
       WHERE id=$1
       RETURNING id, email, role, first_name, last_name, avatar_url, is_email_verified`, [userId, setFirst, setLast, newStoredRole,]);
        const u = res.rows[0];
        const rolesNow = storedRoleToRoles(u.role);
        if (rolesNow.includes('pro')) {
            await this.db.client.query(`INSERT INTO artisan_profiles (user_id, bio)
         VALUES ($1,$2)
         ON CONFLICT (user_id) DO NOTHING;`, [u.id, '']);
        }
        return { ...u, roles: storedRoleToRoles(u.role) };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], UsersService);
//# sourceMappingURL=users.service.js.map