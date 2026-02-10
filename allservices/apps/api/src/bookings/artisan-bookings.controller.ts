import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { BookingsService } from './bookings.service';

@UseGuards(AuthGuard)
@Controller('artisan/bookings')
export class ArtisanBookingsController {
  constructor(private bookings: BookingsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.bookings.listForArtisan(user.sub);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.acceptAsArtisan(user.sub, id);
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.rejectAsArtisan(user.sub, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.completeAsArtisan(user.sub, id);
  }
}
