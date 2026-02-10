import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { ArtisanBookingsController } from './artisan-bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  controllers: [BookingsController, ArtisanBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
