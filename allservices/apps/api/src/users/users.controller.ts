import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { UpdateMeDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.users.me(user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.sub, dto);
  }
}
