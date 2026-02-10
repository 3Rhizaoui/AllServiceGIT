import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ArtisansService } from './artisans.service';

@Controller('artisans')
export class ArtisansController {
  constructor(private artisans: ArtisansService) {}

  @Get()
  list(@Query() query: any) {
    return this.artisans.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.artisans.getById(id);
  }

  // Artisan self-management
  @UseGuards(AuthGuard)
  @Patch('me/profile')
  updateMyProfile(@CurrentUser() user: any, @Body() dto: any) {
    return this.artisans.upsertMyProfile(user.sub, dto);
  }

  @UseGuards(AuthGuard)
  @Post('me/service-areas')
  addMyServiceArea(@CurrentUser() user: any, @Body() dto: any) {
    return this.artisans.addServiceArea(user.sub, dto);
  }
}
