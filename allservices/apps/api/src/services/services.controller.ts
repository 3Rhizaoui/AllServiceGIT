import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ServicesService } from './services.service';

@Controller()
export class ServicesController {
  constructor(private services: ServicesService) {}

  @Get('categories')
  categories() {
    return this.services.categories();
  }

  @Get('services')
  list(@Query('artisan_id') artisanId: string) {
    return this.services.listByArtisan(artisanId);
  }

  // ✅ PRO ONLY
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('pro')
  @Post('artisan/services')
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.services.create(user.sub, dto);
  }

  // ✅ PRO ONLY
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('pro')
  @Patch('artisan/services/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.services.update(user.sub, id, dto);
  }

  // ✅ PRO ONLY
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('pro')
  @Delete('artisan/services/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.services.remove(user.sub, id);
  }
}
