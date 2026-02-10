import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type StoredRole = 'customer' | 'pro' | 'both' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  role: StoredRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev_secret_change_me',
    });

    // debug (tu peux enlever après)
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy] initialized');
  }

  async validate(payload: JwtPayload) {
    // Nest mettra ça dans req.user
    return payload;
  }
}
