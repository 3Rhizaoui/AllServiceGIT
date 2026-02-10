import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpgradeRolesDto } from './dto';
import { User } from './user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('email-exists')
  emailExists(@Query('email') email: string) {
    return this.auth.emailExists(email);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@User() user: any) {
    // IMPORTANT: user.sub doit exister (token signé avec sub)
    return this.auth.me(user?.sub);
  }

  @UseGuards(AuthGuard)
  @Post('upgrade-roles')
  upgradeRoles(@User() user: any, @Body() dto: UpgradeRolesDto) {
    return this.auth.upgradeRoles(user?.sub, dto.add);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@User() user: any) {
    return this.auth.logout(user?.sub);
  }
}
