import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser, AuthUserType } from '../../common/decorators/current-user.decorator.js';
import type { AppRole } from '../../common/decorators/roles.decorator.js';

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: AppRole;
  type: AuthUserType;
  tenantId?: string;
  tenantSlug?: string;
  schemaName?: string;
}


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret') || 'super_secret_jwt_key_multitenant_saas_platform_2026';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload || !payload.sub || !payload.type) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      type: payload.type,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      schemaName: payload.schemaName,
    };
  }
}
