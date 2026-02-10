import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ArtisansModule } from './artisans/artisans.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { DbModule } from './db.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ DB d'abord (global provider)
    DbModule,

    // ✅ Auth ensuite
    AuthModule,
    UsersModule,
    ArtisansModule,
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    HealthModule,
  ],
})
export class AppModule {}
