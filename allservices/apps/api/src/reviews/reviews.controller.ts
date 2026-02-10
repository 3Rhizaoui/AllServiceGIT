import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.reviews.create(user.sub, dto);
  }

  @Get('artisan/:artisanUserId')
  list(@Param('artisanUserId') artisanUserId: string) {
    return this.reviews.listForArtisan(artisanUserId);
  }
}
