import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { BookingsService } from './bookings.service';

@UseGuards(AuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.bookings.create(user.sub, dto);
  }

  @Get()
  listMine(@CurrentUser() user: any) {
    return this.bookings.listForClient(user.sub);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.getById(user.sub, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookings.cancelAsClient(user.sub, id);
  }
}
