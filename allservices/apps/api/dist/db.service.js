"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client','artisan','admin')),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artisan_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT,
  years_experience INT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg DOUBLE PRECISION NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  base_travel_fee NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed','starting_from','hourly')),
  price_amount NUMERIC NOT NULL,
  duration_minutes INT,
  is_emergency_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_travel_included BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  label TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  location GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artisan_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_name TEXT,
  center GEOGRAPHY(Point, 4326),
  radius_km INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artisan_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  address_id UUID NOT NULL REFERENCES addresses(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending','accepted','cancelled','completed','disputed')),
  client_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_payment_intent_id TEXT UNIQUE NOT NULL,
  amount_total NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('requires_payment','succeeded','refunded','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
let DbService = class DbService {
    get client() {
        return this.pool;
    }
    async onModuleInit() {
        console.log("DB_URL:", process.env.DATABASE_URL);
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('Missing DATABASE_URL');
        }
        this.pool = new pg_1.Pool({ connectionString });
        await this.pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
        await this.pool.query(SCHEMA_SQL);
        await this.pool.query(`INSERT INTO service_categories (name, slug)
       VALUES ('Plomberie','plomberie'),('Électricité','electricite'),('Serrurerie','serrurerie'),('Peinture','peinture')
       ON CONFLICT (slug) DO NOTHING;`);
    }
    async onModuleDestroy() {
        await this.pool?.end();
    }
};
exports.DbService = DbService;
exports.DbService = DbService = __decorate([
    (0, common_1.Injectable)()
], DbService);
//# sourceMappingURL=db.service.js.map